const request = require('supertest');
const db = require('./helpers/db');
const { createApp } = require('../app');

let app;
beforeAll(async () => { await db.connect(); app = createApp(); });
afterAll(db.close);

test('sets security headers and hides x-powered-by', async () => {
  const res = await request(app).get('/api/health');
  expect(res.headers['x-powered-by']).toBeUndefined();
  expect(res.headers['x-content-type-options']).toBe('nosniff');
});

test('unknown route returns JSON 404', async () => {
  const res = await request(app).get('/api/nope');
  expect(res.status).toBe(404);
  expect(res.body.error).toMatch(/not found/i);
});

test('malformed JSON returns 400 JSON, not an HTML stack trace', async () => {
  const res = await request(app).post('/api/users/login')
    .set('Content-Type', 'application/json').send('{bad json');
  expect(res.status).toBe(400);
  expect(res.body).toEqual({ error: 'Invalid JSON body' });
});

test('CORS allows the configured origin only', async () => {
  const ok = await request(app).get('/api/health').set('Origin', 'http://localhost:3000');
  expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  const bad = await request(app).get('/api/health').set('Origin', 'http://evil.example');
  expect(bad.headers['access-control-allow-origin']).toBeUndefined();
});
