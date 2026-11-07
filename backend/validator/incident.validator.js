'use strict';

const { z } = require('zod');
const {
  ALL_INCIDENT_STATUSES,
  REPORT_CATEGORIES,
} = require('../constants/incident');

const httpsUrl = z
  .string()
  .url()
  .refine((value) => value.startsWith('https://'), {
    message: 'Media URLs must use HTTPS',
  });

const bbox = z.string().transform((value, ctx) => {
  const parts = value.split(',').map((part) => Number(part.trim()));

  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    ctx.addIssue({
      code: 'custom',
      message: 'bbox must be minLng,minLat,maxLng,maxLat',
    });
    return z.NEVER;
  }

  const [minLng, minLat, maxLng, maxLat] = parts;

  if (minLng > maxLng || minLat > maxLat) {
    ctx.addIssue({
      code: 'custom',
      message: 'bbox minimum values must not exceed maximum values',
    });
    return z.NEVER;
  }

  return { minLng, minLat, maxLng, maxLat };
});

const booleanQuery = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((value) => value === true || value === 'true');

const listIncidentsQuery = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(ALL_INCIDENT_STATUSES).optional(),
    category: z.enum(REPORT_CATEGORIES).optional(),
    campusId: z.string().uuid().optional(),
    q: z.string().min(2).max(100).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    bbox: bbox.optional(),
    includeResolved: booleanQuery.optional(),
  })
  .refine(
    (value) => !value.from || !value.to || value.from.getTime() <= value.to.getTime(),
    {
      message: 'from must not be after to',
      path: ['from'],
    }
  );

const incidentParams = z.object({
  id: z.string().uuid(),
});

const addIncidentUpdateSchema = z
  .object({
    description: z.string().min(3).max(2000),
    observedAt: z.coerce.date().optional(),
    locationName: z.string().min(2).max(200).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
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
  });

module.exports = {
  listIncidentsQuery,
  incidentParams,
  addIncidentUpdateSchema,
};
