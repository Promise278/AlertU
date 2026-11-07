'use strict';

const express = require('express');
const { ROLES } = require('../constants/roles');
const { authorize } = require('../middleware/authenticate');
const validate = require('../middleware/validate.middleware');
const { moderationLimiter } = require('../middleware/rateLimit.middleware');
const {
  decisionSchema,
  incidentParams,
  mergeSchema,
  moderationReportsQuery,
  queueQuery,
  splitSchema,
} = require('../validator/moderation.validator');
const controller = require('../controller/moderation.controller');

const requireModerator = [authorize(ROLES.MODERATOR, ROLES.ADMIN)];

const createModerationRouter = ({ authenticate }) => {
  const router = express.Router();

  router.use(authenticate, moderationLimiter, ...requireModerator);

  router.get('/queue', validate({ query: queueQuery }), controller.queue);
  router.get('/reports', validate({ query: moderationReportsQuery }), controller.reports);
  router.post(
    '/incidents/:id/decision',
    validate({ params: incidentParams, body: decisionSchema }),
    controller.decide
  );
  router.post(
    '/clusters/:id/merge',
    validate({ params: incidentParams, body: mergeSchema }),
    controller.merge
  );
  router.post(
    '/clusters/:id/split',
    validate({ params: incidentParams, body: splitSchema }),
    controller.split
  );

  return router;
};

module.exports = createModerationRouter;
