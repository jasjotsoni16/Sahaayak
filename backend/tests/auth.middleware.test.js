const db = require('./helpers/db');
const { makeUser } = require('./helpers/auth');
const { requireAuth, authorizeRoles, requireSelfOrAdmin, bindBodyToUser } = require('../middleware/auth');
const { checkEnv } = require('../config/env');

beforeAll(db.connect);
afterAll(db.close);

const run = (mw, req) => new Promise((resolve) => {
  const res = {
    statusCode: 200,
    status(c) { this.statusCode = c; return this; },
    json(b) { resolve({ status: this.statusCode, body: b }); },
  };
  Promise.resolve(mw(req, res, () => resolve({ status: 'next' }))).catch(() => {});
});

test('requireAuth: no header -> 401', async () => {
  expect((await run(requireAuth, { headers: {} })).status).toBe(401);
});
test('requireAuth: garbage token -> 401', async () => {
  expect((await run(requireAuth, { headers: { authorization: 'Bearer abc' } })).status).toBe(401);
});
test('requireAuth: valid token -> next and req.user set', async () => {
  const { token, user } = await makeUser('seeker');
  const req = { headers: { authorization: `Bearer ${token}` } };
  expect((await run(requireAuth, req)).status).toBe('next');
  expect(String(req.user._id)).toBe(String(user._id));
});
test('authorizeRoles: wrong role -> 403', async () => {
  const r = await run(authorizeRoles('provider'), { user: { role: 'seeker' } });
  expect(r.status).toBe(403);
});
test('requireSelfOrAdmin: self ok, other 403, admin ok', async () => {
  const mw = requireSelfOrAdmin('userId');
  expect((await run(mw, { user: { _id: 'a', role: 'seeker' }, params: { userId: 'a' } })).status).toBe('next');
  expect((await run(mw, { user: { _id: 'a', role: 'seeker' }, params: { userId: 'b' } })).status).toBe(403);
  expect((await run(mw, { user: { _id: 'z', role: 'admin' }, params: { userId: 'b' } })).status).toBe('next');
});
test('bindBodyToUser overwrites spoofed ids for non-admins only', async () => {
  const mw = bindBodyToUser('seeker_id');
  const req = { user: { _id: 'me', role: 'seeker' }, body: { seeker_id: 'victim' } };
  await run(mw, req);
  expect(req.body.seeker_id).toBe('me');
  const adminReq = { user: { _id: 'adm', role: 'admin' }, body: { seeker_id: 'target' } };
  await run(mw, adminReq);
  expect(adminReq.body.seeker_id).toBe('target');
});
test('checkEnv throws for a short JWT_SECRET in production only', () => {
  const old = { s: process.env.JWT_SECRET, n: process.env.NODE_ENV };
  process.env.JWT_SECRET = 'short';
  process.env.NODE_ENV = 'production';
  expect(() => checkEnv()).toThrow(/JWT_SECRET/);
  process.env.NODE_ENV = 'development';
  const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  expect(() => checkEnv()).not.toThrow();
  spy.mockRestore();
  process.env.JWT_SECRET = old.s; process.env.NODE_ENV = old.n;
});

test('requireSelfOrRole: self ok, listed role ok, other seeker 403', async () => {
  const { requireSelfOrRole } = require('../middleware/auth');
  const mw = requireSelfOrRole('userId', 'provider');
  expect((await run(mw, { user: { _id: 'a', role: 'seeker' }, params: { userId: 'a' } })).status).toBe('next');
  expect((await run(mw, { user: { _id: 'p', role: 'provider' }, params: { userId: 'a' } })).status).toBe('next');
  expect((await run(mw, { user: { _id: 'x', role: 'seeker' }, params: { userId: 'a' } })).status).toBe(403);
  expect((await run(mw, { user: { _id: 'z', role: 'admin' }, params: { userId: 'a' } })).status).toBe('next');
});
