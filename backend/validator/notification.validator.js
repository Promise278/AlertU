'use strict';

const { z } = require('zod');
const { REPORT_CATEGORIES } = require('../constants/incident');

const updatePreferencesSchema = z
  .object({
    enabled: z.boolean().optional(),
    categories: z.array(z.enum(REPORT_CATEGORIES)).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one preference to update',
  });

module.exports = {
  updatePreferencesSchema,
};
