'use strict';

const { Op } = require('sequelize');
const {
  Campus,
  Incident,
  IncidentReport,
  IncidentUpdate,
  ModerationAction,
  Report,
  User,
  sequelize,
} = require('../models');
const env = require('../config/env');
const AppError = require('../util/AppError');
const { isModerator } = require('../constants/roles');
const {
  ACTIVE_STATUSES,
  INCIDENT_STATUSES,
  MODERATION_ACTIONS,
  QUEUE_STATUSES,
  getIncidentTtlHours,
  isActiveStatus,
  isPublicStatus,
} = require('../constants/incident');
const { incidentBase, incidentUpdate, timeline, reportBase } = require('../util/serializers');
const { recordModerationAction } = require('./audit.service');
const { queueIncidentStatusEvents, dispatchEventIds } = require('./notification.service');

const buildFeedWhere = ({ query, viewer }) => {
  const where = {};
  const privileged = isModerator(viewer);

  if (query.campusId) {
    where.campusId = query.campusId;
  } else if (viewer && viewer.campusId) {
    where.campusId = viewer.campusId;
  }

  if (query.category) where.category = query.category;

  if (query.status) {
    if (!privileged && !isPublicStatus(query.status)) {
      throw AppError.forbidden(
        'That incident status is not publicly available',
        'STATUS_SCOPE_FORBIDDEN'
      );
    }
    where.status = query.status;
  } else {
    const statuses = privileged
      ? [...ACTIVE_STATUSES]
      : [...ACTIVE_STATUSES].filter(isPublicStatus);
    if (query.includeResolved) statuses.push('resolved', 'expired');
    where.status = { [Op.in]: [...new Set(statuses)] };
  }

  if (query.from || query.to) {
    where.lastSeenAt = {};
    if (query.from) where.lastSeenAt[Op.gte] = query.from;
    if (query.to) where.lastSeenAt[Op.lte] = query.to;
  }

  if (query.bbox) {
    where.latitude = { [Op.between]: [query.bbox.minLat, query.bbox.maxLat] };
    where.longitude = { [Op.between]: [query.bbox.minLng, query.bbox.maxLng] };
  }

  if (query.q) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${query.q}%` } },
      { publicSummary: { [Op.iLike]: `%${query.q}%` } },
      { locationName: { [Op.iLike]: `%${query.q}%` } },
    ];
  }

  return where;
};

const listIncidents = async ({ query, viewer }) => {
  const where = buildFeedWhere({ query, viewer });

  const { rows, count } = await Incident.findAndCountAll({
    where,
    order: [
      ['lastSeenAt', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    limit: query.limit,
    offset: (query.page - 1) * query.limit,
    include: [{ model: Campus, as: 'campus' }],
  });

  return {
    incidents: rows.map((incident) => incidentBase(incident, { viewer })),
    total: count,
  };
};

const getIncident = async ({ incidentId, viewer }) => {
  const incident = await Incident.findByPk(incidentId, {
    include: [
      { model: Campus, as: 'campus' },
      {
        model: IncidentUpdate,
        as: 'updates',
        separate: true,
        limit: 100,
        order: [['observedAt', 'ASC']],
        include: [
          { model: User, as: 'author', attributes: ['id', 'displayName', 'role'] },
        ],
      },
      {
        model: ModerationAction,
        as: 'moderationActions',
        separate: true,
        limit: 100,
        order: [['createdAt', 'ASC']],
        include: [{ model: User, as: 'actor', attributes: ['id', 'displayName', 'role'] }],
      },
    ],
  });

  if (!incident) throw AppError.notFound('Incident not found', 'INCIDENT_NOT_FOUND');

  const privileged = isModerator(viewer);
  if (!privileged && !isPublicStatus(incident.status)) {
    throw AppError.notFound('Incident not found', 'INCIDENT_NOT_FOUND');
  }

  const response = {
    ...incidentBase(incident, { viewer }),
    timeline: timeline(incident, { moderator: privileged }),
  };

  const links = await IncidentReport.findAll({
    where: { incidentId, active: true },
    include: [
      {
        model: Report,
        as: 'report',
        ...(privileged ? {} : { attributes: ['reporterUserId', 'mediaRefs'] }),
        ...(privileged
          ? {
              include: [
                {
                  model: User,
                  as: 'reporter',
                  attributes: ['id', 'displayName', 'email', 'role'],
                },
              ],
            }
          : {}),
      },
    ],
    order: [['linkedAt', 'ASC']],
  });

  response.mediaRefs = links
    .filter((link) =>
      privileged || (viewer && link.report?.reporterUserId === viewer.id)
    )
    .flatMap((link) => link.report?.mediaRefs || []);

  if (privileged) {
    response.reports = links.map((link) => ({
      ...reportBase(link.report, { viewer }),
      linkSource: link.linkSource,
      linkedAt: link.linkedAt,
    }));
  }

  return response;
};

const addIncidentUpdate = async ({ incidentId, user, payload }) => {
  const result = await sequelize.transaction(async (transaction) => {
    const incident = await Incident.findByPk(incidentId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!incident) throw AppError.notFound('Incident not found', 'INCIDENT_NOT_FOUND');

    if (!isModerator(user) && (!user.campusId || incident.campusId !== user.campusId)) {
      throw AppError.forbidden(
        'You may only update incidents on your campus',
        'CAMPUS_SCOPE_FORBIDDEN'
      );
    }

    if (!isActiveStatus(incident.status)) {
      throw AppError.conflict(
        'This incident is no longer open for observations. Submit a new report instead.',
        'INCIDENT_NOT_OPEN'
      );
    }

    const observedAt = payload.observedAt || new Date();
    const lastSeenAt =
      new Date(observedAt).getTime() > new Date(incident.lastSeenAt).getTime()
        ? observedAt
        : incident.lastSeenAt;
    const ttlHours = getIncidentTtlHours(incident.category, env.INCIDENT_DEFAULT_TTL_HOURS);
    const expiresAt = new Date(new Date(lastSeenAt).getTime() + ttlHours * 60 * 60 * 1000);

    const update = await IncidentUpdate.create(
      {
        incidentId: incident.id,
        authorUserId: user.id,
        description: payload.description,
        observedAt,
        locationName: payload.locationName || incident.locationName,
        latitude: payload.latitude ?? incident.latitude,
        longitude: payload.longitude ?? incident.longitude,
        mediaRefs: payload.mediaRefs || [],
        isAnonymous: payload.isAnonymous,
      },
      { transaction }
    );

    await incident.update({ lastSeenAt, expiresAt }, { transaction });

    return { update, incident };
  });

  return {
    update: incidentUpdate(result.update, { viewer: user }),
    incident: incidentBase(result.incident, { viewer: user }),
  };
};

const getModerationQueue = async ({ query }) => {
  const statuses = query.status ? [query.status] : [...QUEUE_STATUSES];

  const { rows, count } = await Incident.findAndCountAll({
    where: {
      status: { [Op.in]: statuses },
      ...(query.campusId ? { campusId: query.campusId } : {}),
    },
    order: [
      ['lastSeenAt', 'ASC'],
      ['createdAt', 'ASC'],
    ],
    limit: query.limit,
    offset: (query.page - 1) * query.limit,
    include: [{ model: Campus, as: 'campus' }],
  });

  return {
    incidents: rows.map((incident) => incidentBase(incident, { viewer: { role: 'moderator' } })),
    total: count,
  };
};

const expireStaleIncidents = async ({ limit = 100 } = {}) => {
  const stale = await Incident.findAll({
    where: {
      status: { [Op.in]: [...ACTIVE_STATUSES] },
      expiresAt: { [Op.lte]: new Date() },
    },
    attributes: ['id'],
    limit,
    order: [['expiresAt', 'ASC']],
  });

  const expired = [];
  const eventIds = [];

  for (const item of stale) {
    const result = await sequelize.transaction(async (transaction) => {
      const incident = await Incident.findByPk(item.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
        include: [{ model: Campus, as: 'campus' }],
      });

      if (
        !incident ||
        !isActiveStatus(incident.status) ||
        !incident.expiresAt ||
        new Date(incident.expiresAt) > new Date()
      ) {
        return null;
      }

      const beforeStatus = incident.status;
      await incident.update({ status: INCIDENT_STATUSES.EXPIRED }, { transaction });

      const action = await recordModerationAction({
        actorUserId: null,
        incidentId: incident.id,
        action: MODERATION_ACTIONS.SYSTEM_EXPIRED,
        reasonCode: 'condition_expired',
        evidenceNote: 'Automatically expired because the configured freshness window elapsed.',
        beforeStatus,
        afterStatus: INCIDENT_STATUSES.EXPIRED,
        metadata: { expiresAt: incident.expiresAt },
        transaction,
      });

      const events = await queueIncidentStatusEvents({
        incident,
        action,
        transaction,
      });

      return { incident, events };
    });

    if (result) {
      expired.push(result.incident);
      eventIds.push(...result.events.map((event) => event.id));
    }
  }

  dispatchEventIds(eventIds);
  return expired;
};

module.exports = {
  listIncidents,
  getIncident,
  addIncidentUpdate,
  getModerationQueue,
  expireStaleIncidents,
  buildFeedWhere,
};
