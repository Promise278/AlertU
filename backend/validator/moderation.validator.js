'use strict';

const { z } = require('zod');
const {
  ALL_INCIDENT_STATUSES,
  REPORT_CATEGORIES,
} = require('../constants/incident');

const REASON_CODES = [
  'evidence_sufficient',
  'evidence_insufficient',
  'duplicate',
  'false_report',
  'condition_cleared',
  'condition_expired',
  'new_evidence',
  'policy_violation',
  'merged',
  'split',
  'other',
];

const queueQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(ALL_INCIDENT_STATUSES).optional(),
  campusId: z.string().uuid().optional(),
});

const moderationReportsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  campusId: z.string().uuid().optional(),
  q: z.string().min(2).max(100).optional(),
});

const incidentParams = z.object({
  id: z.string().uuid(),
});

const decisionSchema = z
  .object({
    status: z.enum(ALL_INCIDENT_STATUSES),
    reasonCode: z.enum(REASON_CODES),
    evidenceNote: z.string().max(4000).optional(),
    publicSummary: z.string().min(10).max(1000).optional(),
    expiresAt: z.coerce.date().optional(),
  })
  .superRefine((value, ctx) => {
    if (
      ['verified', 'disputed', 'rejected'].includes(value.status) &&
      (!value.evidenceNote || value.evidenceNote.length < 10)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'evidenceNote must be at least 10 characters for this status',
        path: ['evidenceNote'],
      });
    }
  });

const mergeSchema = z.object({
  sourceIncidentIds: z.array(z.string().uuid()).min(1).max(20),
  reasonCode: z.enum(REASON_CODES),
  rationale: z.string().min(10).max(2000),
  title: z.string().min(3).max(160).optional(),
  publicSummary: z.string().min(10).max(1000).optional(),
});

const splitSchema = z
  .object({
    reportIds: z.array(z.string().uuid()).min(1).max(50),
    reasonCode: z.enum(REASON_CODES),
    rationale: z.string().min(10).max(2000),
    title: z.string().min(3).max(160).optional(),
    category: z.enum(REPORT_CATEGORIES).optional(),
    publicSummary: z.string().min(10).max(1000).optional(),
    locationName: z.string().min(2).max(200).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    affectedRadiusMeters: z.number().int().min(10).max(5000).optional(),
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
  queueQuery,
  moderationReportsQuery,
  incidentParams,
  decisionSchema,
  mergeSchema,
  splitSchema,
};
