const request = require('supertest');
const db = require('./helpers/db');
const { makeUser } = require('./helpers/auth');
const { createApp } = require('../app');
const Job = require('../Model/Job');
const { haversineKm } = require('../utils/geo');

let app; let employer;
beforeAll(async () => { await db.connect(); app = createApp(); await Job.init(); });
afterAll(db.close);
beforeEach(async () => { await db.clear(); employer = await makeUser('provider'); });

const mk = (title, lng, lat) => Job.create({
  employer_id: employer.user._id, title, description: 'x', number_of_openings: 1, job_type: 'full_time',
  wage_type: 'monthly', salary_min: 1, salary_max: 2, city: 'Test', location: { type: 'Point', coordinates: [lng, lat] },
});
const radius = (center, r) => request(app).get('/api/jobs/jobs-in-radius').query({ center, radius: r });

test('haversineKm is accurate (Chandigarh -> Delhi is roughly 238 km)', () => {
  expect(haversineKm(30.7333, 76.7794, 28.6139, 77.209)).toBeGreaterThan(230);
  expect(haversineKm(30.7333, 76.7794, 28.6139, 77.209)).toBeLessThan(245);
  expect(haversineKm(10, 10, 10, 10)).toBe(0);
});

test('returns jobs inside the radius, nearest first, with distance_km', async () => {
  await mk('far', 76.9, 30.9);      // ~24 km away
  await mk('near', 76.78, 30.74);   // ~1 km away
  await mk('outside', 77.5, 31.5);  // ~100 km away
  const res = await radius('76.7794,30.7333', 50);
  expect(res.status).toBe(200);
  expect(res.body.map((j) => j.title)).toEqual(['near', 'far']);
  expect(res.body[0].distance_km).toBeGreaterThan(0);
  expect(res.body[0].distance_km).toBeLessThan(res.body[1].distance_km);
});

test('radius defaults to 10 km when omitted', async () => {
  await mk('inside', 76.78, 30.74);
  await mk('beyond', 76.9, 30.9);
  const res = await request(app).get('/api/jobs/jobs-in-radius').query({ center: '76.7794,30.7333' });
  expect(res.status).toBe(200);
  expect(res.body.map((j) => j.title)).toEqual(['inside']);
});

test('rejects malformed centers and radii instead of crashing', async () => {
  expect((await request(app).get('/api/jobs/jobs-in-radius')).status).toBe(400);
  for (const center of ['abc', '76.7', '200,10', '10,95', 'a,b', '76.7,30.7,5']) {
    expect((await radius(center, 10)).status).toBe(400);
  }
  for (const r of [0, -5, 'x', 201]) {
    expect((await radius('76.7794,30.7333', r)).status).toBe(400);
  }
});

test('never returns more than 200 jobs', async () => {
  const docs = Array.from({ length: 205 }, (_, i) => ({
    employer_id: employer.user._id, title: `j${i}`, description: 'x', number_of_openings: 1, job_type: 'full_time',
    wage_type: 'monthly', salary_min: 1, salary_max: 2, city: 'Test',
    location: { type: 'Point', coordinates: [76.78 + i * 0.0001, 30.74] },
  }));
  await Job.collection.insertMany(docs);
  const res = await radius('76.7794,30.7333', 50);
  expect(res.status).toBe(200);
  expect(res.body).toHaveLength(200);
});
