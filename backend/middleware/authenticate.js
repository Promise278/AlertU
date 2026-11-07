'use strict';

const crypto = require('crypto');
const env = require('../config/env');
const AppError = require('../util/AppError');
const { isFirebaseConfigured, verifyIdToken } = require('../config/firebase');
const { resolveFromFirebase, resolveDevUser } = require('../service/user.service');

const readBearerToken = (req) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
};

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const isDevelopmentToken = (token) => {
  if (!env.DEV_AUTH_ENABLED || env.NODE_ENV === 'production') return false;
  if (!env.DEV_AUTH_TOKEN) return false;
  return safeEqual(token, `dev:${env.DEV_AUTH_TOKEN}`);
};

const authenticate = async (req, res, next) => {
  const token = readBearerToken(req);

  if (!token) {
    return next(AppError.unauthorized('Authentication required', 'AUTH_REQUIRED'));
  }

  try {
    if (isDevelopmentToken(token)) {
      req.user = await resolveDevUser();
      req.authType = 'dev';
      return next();
    }

    if (!isFirebaseConfigured()) {
      return next(
        AppError.serviceUnavailable(
          'Firebase Authentication is not configured on this server',
          'AUTH_NOT_CONFIGURED'
        )
      );
    }

    const decoded = await verifyIdToken(token);
    req.user = await resolveFromFirebase(decoded);
    req.authType = 'firebase';
    return next();
  } catch (error) {
    if (error instanceof AppError) return next(error);

    if (String(error.code || '').startsWith('auth/')) {
      return next(
        AppError.unauthorized(
          'Invalid or expired authentication token',
          'INVALID_TOKEN'
        )
      );
    }

    return next(error);
  }
};

const verifyFirebaseUser = async (req, res, next) => {
  const token = readBearerToken(req);

  if (!token) {
    return next(AppError.unauthorized('Authentication required', 'AUTH_REQUIRED'));
  }

  try {
    if (isDevelopmentToken(token)) {
      req.user = await resolveDevUser();
      req.authType = 'dev';
      return next();
    }

    if (!isFirebaseConfigured()) {
      return next(
        AppError.serviceUnavailable(
          'Firebase Authentication is not configured on this server',
          'AUTH_NOT_CONFIGURED'
        )
      );
    }

    req.firebaseUser = await verifyIdToken(token);
    req.authType = 'firebase';
    return next();
  } catch (error) {
    if (error instanceof AppError) return next(error);

    if (String(error.code || '').startsWith('auth/')) {
      return next(
        AppError.unauthorized(
          'Invalid or expired authentication token',
          'INVALID_TOKEN'
        )
      );
    }

    return next(error);
  }
};

const optionalAuth = async (req, res, next) => {
  const token = readBearerToken(req);
  if (!token) return next();
  return authenticate(req, res, next);
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(AppError.unauthorized('Authentication required', 'AUTH_REQUIRED'));
  }

  if (!roles.includes(req.user.role)) {
    return next(AppError.forbidden('You do not have permission to do that', 'FORBIDDEN'));
  }

  return next();
};

module.exports = {
  authenticate,
  verifyFirebaseUser,
  optionalAuth,
  authorize,
};
