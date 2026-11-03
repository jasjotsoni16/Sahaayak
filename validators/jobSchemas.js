const { z } = require('zod');

const number = '-?\\d+(?:\\.\\d+)?';

// ?center=<lng>,<lat>&radius=<km>   (radius defaults to 10 km, max 200 km)
exports.radiusQuery = z.object({
  center: z.string()
    .regex(new RegExp(`^${number},${number}$`), 'must be "lng,lat"')
    .transform((s) => s.split(',').map(Number))
    .refine(([lng, lat]) => lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90, 'coordinates out of range'),
  radius: z.coerce.number().gt(0, 'must be greater than 0').max(200, 'must be at most 200 km').optional(),
});
