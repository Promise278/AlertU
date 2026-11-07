'use strict';

const { z } = require('zod');

const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const uuidParams = (key = 'id') =>
  z.object({
    [key]: z.string().uuid(),
  });

module.exports = {
  paginationQuery,
  uuidParams,
};
