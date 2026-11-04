const request = require('supertest');
const db = require('./helpers/db');
const { createApp } = require('../app');
const { listRoutes } = require('../routes');

let app;
beforeAll(async () => { await db.connect(); app = createApp(); });
afterAll(db.close);

test('GET / responds 200', async () => {
  const res = await request(app).get('/');
  expect(res.status).toBe(200);
});

test('GET /api/health reports ok', async () => {
  const res = await request(app).get('/api/health');
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ status: 'ok' });
});

test('route registry lists every mounted endpoint', () => {
  const routes = listRoutes();
  expect(routes.length).toBeGreaterThan(100);
  expect(routes).toContainEqual({ method: 'POST', path: '/api/users/login' });
});
