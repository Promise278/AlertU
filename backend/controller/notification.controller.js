'use strict';

const asyncHandler = require('../util/asyncHandler');
const { paginationMeta } = require('../util/pagination');
const notificationService = require('../service/notification.service');

const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit } = req.validated.query;
  const { notifications, total } = await notificationService.listNotifications({
    userId: req.user.id,
    page,
    limit,
  });

  res.status(200).json({
    data: notifications,
    meta: paginationMeta({ page, limit, total }),
  });
});

const getPreferences = asyncHandler(async (req, res) => {
  const preferences = await notificationService.getPreferences(req.user.id);
  res.status(200).json({ data: preferences });
});

const updatePreferences = asyncHandler(async (req, res) => {
  const preferences = await notificationService.updatePreferences(
    req.user.id,
    req.validated.body
  );
  res.status(200).json({ data: preferences });
});

module.exports = {
  listNotifications,
  getPreferences,
  updatePreferences,
};
