'use strict';

const { STATUS_LABELS } = require('../constants/incident');
const { isModerator } = require('../constants/roles');

const asPlain = (record) =>
  record && typeof record.get === 'function' ? record.get({ plain: true }) : record;

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toIso = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const userSummary = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    displayName: user.displayName,
    role: user.role,
  };
};

const campusSummary = (campus) => {
  if (!campus) return null;
  return {
    id: campus.id,
    name: campus.name,
    slug: campus.slug,
    timezone: campus.timezone,
  };
};

const freshness = (incident) => {
  const now = Date.now();
  const lastSeenAt = incident.lastSeenAt ? new Date(incident.lastSeenAt).getTime() : null;
  const expiresAt = incident.expiresAt ? new Date(incident.expiresAt).getTime() : null;

  return {
    isStale: Boolean(expiresAt && expiresAt <= now),
    expiresAt: toIso(incident.expiresAt),
    ageMinutes:
      lastSeenAt === null || Number.isNaN(lastSeenAt)
        ? null
        : Math.max(0, Math.floor((now - lastSeenAt) / 60000)),
    expiresInMinutes:
      expiresAt === null || Number.isNaN(expiresAt)
        ? null
        : Math.ceil((expiresAt - now) / 60000),
  };
};

const incidentBase = (incident, { viewer } = {}) => {
  const data = asPlain(incident);
  if (!data) return null;

  const result = {
    id: data.id,
    campusId: data.campusId,
    campus: campusSummary(data.campus),
    title: data.title,
    category: data.category,
    status: data.status,
    statusLabel: STATUS_LABELS[data.status] || data.status,
    publicSummary: data.publicSummary ?? null,
    firstSeenAt: toIso(data.firstSeenAt),
    lastSeenAt: toIso(data.lastSeenAt),
    expiresAt: toIso(data.expiresAt),
    locationName: data.locationName,
    latitude: toNumber(data.latitude),
    longitude: toNumber(data.longitude),
    affectedRadiusMeters: data.affectedRadiusMeters,
    reportCount: data.reportCount,
    freshness: freshness(data),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };

  if (isModerator(viewer)) {
    result.createdByUserId = data.createdByUserId ?? null;
  }

  return result;
};

const incidentUpdate = (update, { viewer } = {}) => {
  const data = asPlain(update);
  if (!data) return null;

  const result = {
    id: data.id,
    description: data.description,
    observedAt: toIso(data.observedAt),
    locationName: data.locationName ?? null,
    mediaRefs: Array.isArray(data.mediaRefs) ? data.mediaRefs : [],
    isAnonymous: data.isAnonymous,
    createdAt: toIso(data.createdAt),
  };

  if (isModerator(viewer) && data.author) {
    result.author = userSummary(data.author);
  }

  return result;
};

const timeline = (incident, { moderator = false } = {}) => {
  const data = asPlain(incident);
  if (!data) return [];

  const entries = [];

  if (data.firstSeenAt) {
    entries.push({
      id: `${data.id}:report_received`,
      type: 'report_received',
      description: data.publicSummary || 'An incident report was received.',
      status: data.status,
      observedAt: toIso(data.firstSeenAt),
      locationName: data.locationName,
      createdAt: toIso(data.firstSeenAt),
    });
  }

  for (const update of data.updates || []) {
    const serialized = incidentUpdate(update, { viewer: moderator ? { role: 'moderator' } : null });
    entries.push({
      id: serialized.id,
      type: 'observation',
      description: serialized.description,
      status: data.status,
      observedAt: serialized.observedAt,
      locationName: serialized.locationName,
      createdAt: serialized.createdAt,
    });
  }

  for (const action of data.moderationActions || []) {
    const entry = {
      id: action.id,
      type: 'moderation',
      description: moderator
        ? action.evidenceNote || `Moderation action: ${action.action}`
        : `Incident status updated to ${
            STATUS_LABELS[action.afterStatus] || action.afterStatus || 'a new state'
          }.`,
      status: action.afterStatus || data.status,
      createdAt: toIso(action.createdAt),
    };

    if (moderator) {
      entry.action = action.action;
      entry.reasonCode = action.reasonCode;
      entry.beforeStatus = action.beforeStatus;
      entry.afterStatus = action.afterStatus;
    }

    entries.push(entry);
  }

  return entries.sort((left, right) => {
    const leftTime = new Date(left.observedAt || left.createdAt || 0).getTime();
    const rightTime = new Date(right.observedAt || right.createdAt || 0).getTime();
    return leftTime - rightTime;
  });
};

const reportBase = (report, { viewer } = {}) => {
  const data = asPlain(report);
  if (!data) return null;

  const owner = Boolean(viewer && viewer.id === data.reporterUserId);
  const privileged = isModerator(viewer);

  const result = {
    id: data.id,
    category: data.category,
    description: data.description,
    observedAt: toIso(data.observedAt),
    submittedAt: toIso(data.submittedAt),
    locationName: data.locationName,
    latitude: toNumber(data.latitude),
    longitude: toNumber(data.longitude),
    mediaRefs: Array.isArray(data.mediaRefs) ? data.mediaRefs : [],
    isAnonymous: data.isAnonymous,
    campusId: data.campusId,
    campus: campusSummary(data.campus),
  };

  if (owner || privileged) {
    result.reporterUserId = data.reporterUserId;
    if (data.reporter) result.reporter = userSummary(data.reporter);
  }

  return result;
};

const post = (record, { viewer, liked = false } = {}) => {
  const data = asPlain(record);
  if (!data) return null;

  const owner = Boolean(viewer && viewer.id === data.authorUserId);
  const privileged = isModerator(viewer);

  const result = {
    id: data.id,
    campusId: data.campusId,
    type: data.type,
    title: data.title ?? null,
    body: data.body,
    mediaRefs: Array.isArray(data.mediaRefs) ? data.mediaRefs : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    isPinned: data.isPinned,
    likeCount: data.likeCount,
    commentCount: data.commentCount,
    liked: Boolean(liked),
    isOwner: owner,
    author: userSummary(data.author),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };

  if (owner || privileged) {
    result.status = data.status;
  }

  return result;
};

const postComment = (comment, { viewer } = {}) => {
  const data = asPlain(comment);
  if (!data) return null;

  const result = {
    id: data.id,
    postId: data.postId,
    body: data.body,
    author: userSummary(data.author),
    isOwner: Boolean(viewer && viewer.id === data.authorUserId),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };

  if (isModerator(viewer)) {
    result.status = data.status;
  }

  return result;
};

const moderationAction = (action, { moderator = false } = {}) => {
  const data = asPlain(action);
  if (!data) return null;

  const result = {
    id: data.id,
    action: data.action,
    reasonCode: data.reasonCode,
    beforeStatus: data.beforeStatus,
    afterStatus: data.afterStatus,
    createdAt: toIso(data.createdAt),
  };

  if (moderator) {
    result.actor = userSummary(data.actor);
    result.evidenceNote = data.evidenceNote ?? null;
    result.metadata = data.metadata || {};
  }

  return result;
};

module.exports = {
  incidentBase,
  incidentUpdate,
  timeline,
  reportBase,
  post,
  postComment,
  moderationAction,
};
