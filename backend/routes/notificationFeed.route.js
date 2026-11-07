'use strict';

const express = require('express');
const validate = require('../middleware/validate.middleware');
const { paginationQuery } = require('../validator/common.validator');
const controller = require('../controller/notification.controller');

const createNotificationFeedRouter = ({ authenticate }) => {
  const router = express.Router();

  router.get(
    '/',
    authenticate,
    validate({ query: paginationQuery }),
    controller.listNotifications
  );

  return router;
};

module.exports = createNotificationFeedRouter;
