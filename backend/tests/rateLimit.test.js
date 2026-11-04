// Own file: the env var must be set before the app (and its limiter) is required.
process.env.AUTH_RATE_LIMIT_MAX = '3';
const request = require('supertest');
const db = require('./helpers/db');
const { createApp } = require('../app');

let app;
beforeAll(async () => { await db.connect(); app = createApp(); });
afterAll(db.close);

test('login is rate limited after the configured number of attempts', async () => {
  const statuses = [];
  for (let i = 0; i < 5; i++) {
    const res = await request(app).post('/api/users/login').send({ phone_number: 'x', password: 'y' });
    statuses.push(res.status);
  }
  expect(statuses.slice(0, 3)).not.toContain(429);
  expect(statuses.slice(3)).toEqual([429, 429]);
});
