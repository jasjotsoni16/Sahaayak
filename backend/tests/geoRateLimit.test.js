// Own file: the limiter reads its env var when the app is created.
process.env.GEO_RATE_LIMIT_MAX = '3';
process.env.GEOCODER = 'nominatim'; // the mocked provider below
process.env.GEOCODER_MIN_INTERVAL_MS = '0';
jest.mock('../services/geocoding/providers/nominatim');
const provider = require('../services/geocoding/providers/nominatim');
const request = require('supertest');
const db = require('./helpers/db');
const { createApp } = require('../app');

let app;
beforeAll(async () => { await db.connect(); app = createApp(); provider.search.mockResolvedValue([]); });
afterAll(db.close);

test('geo endpoints are rate limited per client', async () => {
  const statuses = [];
  for (let i = 0; i < 5; i++) statuses.push((await request(app).get('/api/geo/search').query({ q: `place ${i}` })).status);
  expect(statuses.slice(0, 3)).toEqual([200, 200, 200]);
  expect(statuses.slice(3)).toEqual([429, 429]);
});
