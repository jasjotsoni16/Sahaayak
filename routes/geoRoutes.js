const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const geo = require('../services/geocoding');
const { validateQuery } = require('../middleware/validate');

const router = express.Router();

// Public (signup needs it before the user has a token), so it is limited per client.
router.use(rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.GEO_RATE_LIMIT_MAX) || 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many location lookups, slow down' },
}));

const searchQuery = z.object({ q: z.string().trim().min(2).max(100) });
const reverseQuery = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

router.get('/search', validateQuery(searchQuery), async (req, res) => {
  res.json({ results: await geo.geocode(req.validQuery.q) });
});

router.get('/reverse', validateQuery(reverseQuery), async (req, res) => {
  res.json({ place: await geo.reverseGeocode(req.validQuery.lat, req.validQuery.lng) });
});

module.exports = router;
