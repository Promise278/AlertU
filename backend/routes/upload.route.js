'use strict';

const express = require('express');
const { writeLimiter } = require('../middleware/rateLimit.middleware');
const controller = require('../controller/upload.controller');

const createUploadRouter = ({ authenticate }) => {
  const router = express.Router();

  router.post('/signature', authenticate, writeLimiter, controller.createSignature);

  return router;
};

module.exports = createUploadRouter;
