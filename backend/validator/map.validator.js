'use strict';

const { z } = require('zod');

const geocodeSchema = z.object({
  address: z.string().min(5).max(300),
});

const reverseGeocodeSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

module.exports = {
  geocodeSchema,
  reverseGeocodeSchema,
};
