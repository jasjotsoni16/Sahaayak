const request = require('supertest');
const db = require('./helpers/db');
const { createApp } = require('../app');
const { listRoutes } = require('../routes');
const { PUBLIC, OPEN_FOR_NOW } = require('./routeAuth.lists');

let app;
beforeAll(async () => { await db.connect(); app = createApp(); });
afterAll(db.close);

const FAKE_ID = '000000000000000000000001';
const key = (r) => `${r.method} ${r.path}`;
const fill = (p) => p.replace(/:[A-Za-z_]+/g, FAKE_ID);
const call = (r) => request(app)[r.method.toLowerCase()](fill(r.path)).send({});

const routes = listRoutes();

test('every PUBLIC / OPEN_FOR_NOW entry names a real route (no typos)', () => {
  const real = new Set(routes.map(key));
  const unknown = [...PUBLIC, ...OPEN_FOR_NOW].filter((k) => !real.has(k));
  expect(unknown).toEqual([]);
});

test('every route outside PUBLIC / OPEN_FOR_NOW rejects anonymous requests with 401', async () => {
  const skip = new Set([...PUBLIC, ...OPEN_FOR_NOW]);
  const failures = [];
  for (const r of routes.filter((r) => !skip.has(key(r)))) {
    const res = await call(r);
    if (res.status !== 401) failures.push(`${key(r)} -> ${res.status}`);
  }
  expect(failures).toEqual([]);
});

test('OPEN_FOR_NOW entries are still open (delete the line once fixed)', async () => {
  const stillOpen = [];
  for (const k of OPEN_FOR_NOW) {
    const [method, path] = k.split(' ');
    const res = await call({ method, path });
    if (res.status !== 401) stillOpen.push(k);
  }
  expect(stillOpen).toEqual(OPEN_FOR_NOW);
});
