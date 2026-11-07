'use strict';

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { UniqueConstraintError, Op } = require('sequelize');
const { User, Campus } = require('../models');
const env = require('../config/env');
const AppError = require('../util/AppError');
const { ROLES, ALL_ROLES } = require('../constants/roles');

const sanitizeName = (value) => {
  const name = String(value || '').trim().slice(0, 120);
  return name || 'AlertU user';
};

const sanitizeUsername = (value) => {
  const cleaned = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 100);

  if (cleaned.length >= 4) return cleaned;
  return `user-${crypto.randomUUID().slice(0, 8)}`;
};

const safeEmail = (value) => {
  if (!value) return null;
  const email = String(value).trim().toLowerCase().slice(0, 320);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
};

const findDefaultCampusId = async () => {
  const campuses = await Campus.findAll({
    where: { isActive: true },
    attributes: ['id'],
    limit: 2,
  });
  return campuses.length === 1 ? campuses[0].id : null;
};

const withCampus = (userId) =>
  User.findByPk(userId, {
    include: [{ model: Campus, as: 'campus' }],
  });

const toPublicProfile = (user) => ({
  id: user.id,
  name: user.displayName,
  email: user.email,
  role: user.role,
  campusId: user.campusId,
  accountStatus: user.accountStatus,
  campus: user.campus
    ? { id: user.campus.id, name: user.campus.name }
    : null,
});

const findExistingUser = async (decoded) => {
  if (!decoded || !decoded.uid) {
    throw AppError.unauthorized('Invalid authentication token', 'INVALID_TOKEN');
  }

  let user = await User.findOne({
    where: { firebaseUid: decoded.uid },
    include: [{ model: Campus, as: 'campus' }],
  });

  if (user) return user;

  const email = safeEmail(decoded.email);
  if (!email || !decoded.email_verified) return null;

  user = await User.findOne({
    where: { email },
    include: [{ model: Campus, as: 'campus' }],
  });

  if (!user) return null;

  if (!user.firebaseUid) {
    await user.update({
      firebaseUid: decoded.uid,
      lastSeenAt: new Date(),
    });
  }

  return user;
};

const resolveFromFirebase = async (decoded) => {
  if (!decoded || !decoded.uid) {
    throw AppError.unauthorized('Invalid authentication token', 'INVALID_TOKEN');
  }

  let user = await User.findOne({
    where: { firebaseUid: decoded.uid },
    include: [{ model: Campus, as: 'campus' }],
  });

  if (!user) {
    const email = safeEmail(decoded.email);

    if (email) {
      user = await User.findOne({
        where: { email },
        include: [{ model: Campus, as: 'campus' }],
      });

      if (user) {
        if (!decoded.email_verified) {
          throw AppError.conflict(
            'An account with this email already exists. Sign in with the method you registered with.',
            'ACCOUNT_EXISTS'
          );
        }

        if (!user.firebaseUid) {
          await user.update({
            firebaseUid: decoded.uid,
            lastSeenAt: new Date(),
          });
        }
      }
    }
  }

  if (!user) {
    const email = safeEmail(decoded.email);
    const displayName = sanitizeName(decoded.name || email?.split('@')[0]);
    const campusId = await findDefaultCampusId();
    const password = await bcrypt.hash(crypto.randomUUID(), 12);

    try {
      user = await User.create({
        firebaseUid: decoded.uid,
        displayName,
        username: sanitizeUsername(email?.split('@')[0] || decoded.uid),
        password,
        email,
        role: ROLES.STUDENT,
        campusId,
        accountStatus: 'active',
        lastSeenAt: new Date(),
      });
    } catch (error) {
      if (!(error instanceof UniqueConstraintError)) throw error;
      user = await User.findOne({ where: { firebaseUid: decoded.uid } });
    }
  } else {
    const updates = { lastSeenAt: new Date() };

    if (decoded.name && (!user.displayName || user.displayName === 'AlertU user')) {
      updates.displayName = sanitizeName(decoded.name);
    }
    if (!user.email && decoded.email) {
      updates.email = safeEmail(decoded.email);
    }
    if (!user.campusId) {
      const campusId = await findDefaultCampusId();
      if (campusId) updates.campusId = campusId;
    }

    await user.update(updates);
  }

  if (!user) {
    throw AppError.unauthorized('User profile could not be resolved', 'INVALID_TOKEN');
  }

  if (user.accountStatus !== 'active') {
    throw AppError.forbidden('This account is not active', 'ACCOUNT_INACTIVE');
  }

  if (!user.campus) {
    user = await withCampus(user.id);
  }

  return user;
};

const resolveDevUser = async () => {
  if (!env.DEV_AUTH_ENABLED || env.NODE_ENV === 'production') {
    throw AppError.unauthorized('Development authentication is not enabled', 'AUTH_REQUIRED');
  }

  const email = safeEmail(env.DEV_AUTH_EMAIL) || 'dev@alertu.local';
  let user = await User.findOne({
    where: { email },
    include: [{ model: Campus, as: 'campus' }],
  });

  if (!user) {
    const campusId = env.DEV_AUTH_CAMPUS_ID || (await findDefaultCampusId());
    const password = await bcrypt.hash(crypto.randomUUID(), 12);

    user = await User.create({
      firebaseUid: null,
      displayName: sanitizeName(env.DEV_AUTH_NAME),
      username: sanitizeUsername(email.split('@')[0] || env.DEV_AUTH_UID),
      password,
      email,
      role: ROLES.STUDENT,
      campusId,
      accountStatus: 'active',
      lastSeenAt: new Date(),
    });

    user = await withCampus(user.id);
  } else {
    const updates = { lastSeenAt: new Date() };

    if (env.DEV_AUTH_NAME && user.displayName === 'AlertU user') {
      updates.displayName = sanitizeName(env.DEV_AUTH_NAME);
    }
    if (!user.campusId) {
      const campusId = env.DEV_AUTH_CAMPUS_ID || (await findDefaultCampusId());
      if (campusId) updates.campusId = campusId;
    }

    await user.update(updates);

    if (!user.campus) {
      user = await withCampus(user.id);
    }
  }

  if (!user || user.accountStatus !== 'active') {
    throw AppError.forbidden('This account is not active', 'ACCOUNT_INACTIVE');
  }

  return user;
};

const getProfile = async (userId) => {
  const user = await withCampus(userId);
  if (!user) throw AppError.notFound('User profile not found', 'USER_NOT_FOUND');
  return user;
};

const setRole = async ({ identifier, role }) => {
  if (!ALL_ROLES.includes(role)) {
    throw new Error(`Role must be one of: ${ALL_ROLES.join(', ')}`);
  }

  const where = identifier.includes('@')
    ? { email: identifier.toLowerCase() }
    : { [Op.or]: [{ firebaseUid: identifier }, { id: identifier }] };

  const user = await User.findOne({ where });
  if (!user) throw new Error('User not found. The user must sign in once before a role is assigned.');

  await user.update({ role });
  return user;
};

module.exports = {
  resolveFromFirebase,
  resolveDevUser,
  findExistingUser,
  toPublicProfile,
  getProfile,
  setRole,
  findDefaultCampusId,
  sanitizeName,
  sanitizeUsername,
  safeEmail,
};
