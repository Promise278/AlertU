'use strict';

const { Op } = require('sequelize');
const env = require('../config/env');
const logger = require('../config/logger');
const {
  DeviceToken,
  Incident,
  NotificationEvent,
  NotificationPreference,
  User,
} = require('../models');
const { NOTIFICATION_EVENT_STATES } = require('../constants/device');
const { STATUS_LABELS, isNotifiableStatus } = require('../constants/incident');
const { pushService } = require('./push.service');

const truncate = (value, max) => String(value || '').slice(0, max);

const listNotifications = async ({ userId, page, limit }) => {
  const { rows, count } = await NotificationEvent.findAndCountAll({
    where: { recipientUserId: userId },
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  return {
    notifications: rows.map((event) => ({
      id: event.id,
      type: event.eventType,
      title: event.payload?.title || 'AlertU update',
      message: event.payload?.body || '',
      data: event.payload?.data || {},
      state: event.state,
      createdAt: event.createdAt,
      sentAt: event.sentAt,
    })),
    total: count,
  };
};

const getPreferences = async (userId, transaction) => {
  const preference = await NotificationPreference.findOne({
    where: { userId },
    transaction,
  });

  if (!preference) {
    return {
      id: null,
      userId,
      enabled: true,
      categories: [],
      isDefault: true,
    };
  }

  return {
    id: preference.id,
    userId,
    enabled: preference.enabled,
    categories: Array.isArray(preference.categories) ? preference.categories : [],
    isDefault: false,
  };
};

const updatePreferences = async (userId, input) => {
  const [preference] = await NotificationPreference.findOrCreate({
    where: { userId },
    defaults: {
      userId,
      enabled: input.enabled ?? true,
      categories: input.categories ?? [],
    },
  });

  const updates = {};
  if (input.enabled !== undefined) updates.enabled = input.enabled;
  if (input.categories !== undefined) updates.categories = input.categories;

  if (Object.keys(updates).length > 0) await preference.update(updates);
  return getPreferences(userId);
};

const recipientsForIncident = async ({ incident, actorUserId, transaction }) => {
  const where = {
    campusId: incident.campusId,
    accountStatus: 'active',
  };
  if (actorUserId) where.id = { [Op.ne]: actorUserId };

  const users = await User.findAll({
    where,
    attributes: ['id'],
    include: [
      {
        model: DeviceToken,
        as: 'deviceTokens',
        attributes: ['id'],
        where: { active: true },
        required: true,
      },
    ],
    transaction,
  });

  if (users.length === 0) return [];

  const preferences = await NotificationPreference.findAll({
    where: { userId: users.map((user) => user.id) },
    transaction,
  });
  const preferenceByUser = new Map(preferences.map((item) => [item.userId, item]));

  return users.filter((user) => {
    const preference = preferenceByUser.get(user.id);
    if (!preference) return true;
    if (!preference.enabled) return false;
    const categories = Array.isArray(preference.categories) ? preference.categories : [];
    return categories.length === 0 || categories.includes(incident.category);
  });
};

const queueIncidentStatusEvents = async ({ incident, action, transaction }) => {
  if (!isNotifiableStatus(incident.status)) return [];

  const users = await recipientsForIncident({
    incident,
    actorUserId: action.actorUserId,
    transaction,
  });

  if (users.length === 0) return [];

  const statusLabel = STATUS_LABELS[incident.status] || incident.status;
  const body =
    incident.publicSummary ||
    `A campus incident is now ${statusLabel}. Open AlertU for the latest context.`;

  const events = [];

  for (const user of users) {
    const dedupeKey = truncate(
      `incident:${incident.id}:action:${action.id}:user:${user.id}`,
      240
    );

    const [event, created] = await NotificationEvent.findOrCreate({
      where: { dedupeKey },
      defaults: {
        eventType: 'incident_status_changed',
        dedupeKey,
        state: NOTIFICATION_EVENT_STATES.PENDING,
        incidentId: incident.id,
        recipientUserId: user.id,
        payload: {
          title: `${statusLabel}: ${truncate(incident.title, 100)}`,
          body: truncate(body, 200),
          data: {
            type: 'incident',
            incidentId: incident.id,
            status: incident.status,
            deepLink: `alertu://incident?id=${incident.id}`,
          },
        },
      },
      transaction,
    });

    if (created) events.push(event);
  }

  return events;
};

const queuePostEvent = async ({ post, actor, type, comment, transaction }) => {
  if (!post.authorUserId || post.authorUserId === actor.id) return null;

  const author = await User.findOne({
    where: { id: post.authorUserId, accountStatus: 'active' },
    attributes: ['id'],
    include: [
      {
        model: NotificationPreference,
        as: 'notificationPreference',
        required: false,
      },
      {
        model: DeviceToken,
        as: 'deviceTokens',
        attributes: ['id'],
        where: { active: true },
        required: true,
      },
    ],
    transaction,
  });

  if (!author) return null;
  if (author.notificationPreference && !author.notificationPreference.enabled) return null;

  const isComment = type === 'post_comment';
  const dedupeKey = isComment
    ? truncate(`post:${post.id}:comment:${comment.id}:user:${author.id}`, 240)
    : truncate(`post:${post.id}:like:${actor.id}:user:${author.id}`, 240);

  const [event, created] = await NotificationEvent.findOrCreate({
    where: { dedupeKey },
    defaults: {
      eventType: type,
      dedupeKey,
      state: NOTIFICATION_EVENT_STATES.PENDING,
      incidentId: null,
      recipientUserId: author.id,
      payload: {
        title: isComment ? 'New comment' : 'New like',
        body: isComment
          ? `${actor.displayName} commented on your post.`
          : `${actor.displayName} liked your post.`,
        data: {
          type: 'post',
          postId: post.id,
          deepLink: `alertu://post?id=${post.id}`,
        },
      },
    },
    transaction,
  });

  return created ? event : null;
};

const markInvalidTokens = async (tokens) => {
  if (!tokens || tokens.length === 0) return;
  await DeviceToken.update(
    { active: false },
    { where: { token: { [Op.in]: tokens }, active: true } }
  );
};

const deliverEvent = async (eventId) => {
  const event = await NotificationEvent.findByPk(eventId, {
    include: [
      { model: Incident, as: 'incident', required: false },
      { model: User, as: 'recipient', required: false },
    ],
  });

  if (!event) return null;
  if ([NOTIFICATION_EVENT_STATES.SENT, NOTIFICATION_EVENT_STATES.SKIPPED].includes(event.state)) {
    return event;
  }

  if (!env.PUSH_ENABLED) {
    await event.update({
      state: NOTIFICATION_EVENT_STATES.SKIPPED,
      lastError: 'Push delivery is disabled by server configuration',
    });
    return event;
  }

  if (!event.recipientUserId) {
    await event.update({
      state: NOTIFICATION_EVENT_STATES.SKIPPED,
      lastError: 'Recipient no longer exists',
    });
    return event;
  }

  await event.update({ state: NOTIFICATION_EVENT_STATES.PROCESSING });

  const tokens = await DeviceToken.findAll({
    where: { userId: event.recipientUserId, active: true },
    attributes: ['token'],
  });

  if (tokens.length === 0) {
    await event.update({
      state: NOTIFICATION_EVENT_STATES.SKIPPED,
      lastError: 'No active device tokens',
      attempts: event.attempts + 1,
    });
    return event;
  }

  try {
    const result = await pushService.sendToTokens(
      tokens.map((item) => item.token),
      {
        title: event.payload.title,
        body: event.payload.body,
        data: event.payload.data,
      }
    );

    await markInvalidTokens(result.invalidTokens);

    const successful = result.delivered > 0;
    const errorSummary = result.errors
      .slice(0, 3)
      .map((item) => `${item.code}: ${item.message}`)
      .join('; ');

    await event.update({
      state: successful ? NOTIFICATION_EVENT_STATES.SENT : NOTIFICATION_EVENT_STATES.FAILED,
      attempts: event.attempts + 1,
      sentAt: successful ? new Date() : null,
      lastError: successful || !errorSummary ? null : truncate(errorSummary, 1800),
    });
  } catch (error) {
    await event.update({
      state: NOTIFICATION_EVENT_STATES.FAILED,
      attempts: event.attempts + 1,
      lastError: truncate(error.message, 1800),
    });
  }

  return event;
};

const dispatchEventIds = (eventIds = []) => {
  if (eventIds.length === 0) return;

  setImmediate(() => {
    eventIds.forEach((eventId) => {
      deliverEvent(eventId).catch((error) => {
        logger.error({ err: error, eventId }, 'notification delivery failed');
      });
    });
  });
};

const retryPendingEvents = async ({ limit = 100 } = {}) => {
  const staleProcessing = new Date(Date.now() - 10 * 60 * 1000);
  const events = await NotificationEvent.findAll({
    where: {
      attempts: { [Op.lt]: env.NOTIFICATION_MAX_ATTEMPTS },
      [Op.or]: [
        { state: NOTIFICATION_EVENT_STATES.PENDING },
        { state: NOTIFICATION_EVENT_STATES.FAILED },
        {
          state: NOTIFICATION_EVENT_STATES.PROCESSING,
          updatedAt: { [Op.lt]: staleProcessing },
        },
      ],
    },
    attributes: ['id'],
    order: [['createdAt', 'ASC']],
    limit,
  });

  const results = [];
  for (const event of events) {
    results.push(await deliverEvent(event.id));
  }
  return results;
};

module.exports = {
  listNotifications,
  getPreferences,
  updatePreferences,
  queueIncidentStatusEvents,
  queuePostEvent,
  deliverEvent,
  dispatchEventIds,
  retryPendingEvents,
};
