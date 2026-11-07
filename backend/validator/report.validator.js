'use strict';

const { z } = require('zod');
const { REPORT_CATEGORIES } = require('../constants/incident');

const httpsUrl = z
  .string()
  .url()
  .refine((value) => value.startsWith('https://'), {
    message: 'Media URLs must use HTTPS',
  });

const createReportSchema = z
  .object({
    campusId: z.string().uuid().optional(),
    category: z.enum(REPORT_CATEGORIES),
    description: z.string().min(5).max(4000),
    observedAt: z.coerce.date().optional(),
    locationName: z.string().min(2).max(200),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    address: z.string().min(5).max(300).optional(),
    mediaRefs: z.array(httpsUrl).max(5).optional(),
    isAnonymous: z.boolean().default(true),
  })
  .superRefine((value, ctx) => {
    const hasLatitude = value.latitude !== undefined;
    const hasLongitude = value.longitude !== undefined;

    if (hasLatitude !== hasLongitude) {
      ctx.addIssue({
        code: 'custom',
        message: 'latitude and longitude must be supplied together',
        path: hasLatitude ? ['longitude'] : ['latitude'],
      });
    }

    if (!hasLatitude && !hasLongitude && !value.address) {
      ctx.addIssue({
        code: 'custom',
        message: 'Provide latitude/longitude or an address',
        path: ['address'],
      });
    }
  });

module.exports = {
  createReportSchema,
};
