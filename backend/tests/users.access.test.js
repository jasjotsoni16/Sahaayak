const request = require('supertest');
const db = require('./helpers/db');
const { makeUser } = require('./helpers/auth');
const { createApp } = require('../app');
const UserSkill = require('../Model/UserSkill');
const Skill = require('../Model/Skill');

let app;
beforeAll(async () => { await db.connect(); app = createApp(); });
afterAll(db.close);
beforeEach(db.clear);

const makeUserSkill = async (owner) => {
  const skill = await Skill.create({ name: `Skill ${Date.now()}${Math.random()}` });
  return UserSkill.create({ user_id: owner.user._id, skill_id: skill._id });
};

test('GET /users/:id hides private fields from other users but not from the owner', async () => {
  const owner = await makeUser('seeker', { pan: 'ABCDE1234F', address: '12 Main St', email: 'a@b.co' });
  const viewer = await makeUser('provider');
  const seenByOther = await request(app).get(`/api/users/${owner.user._id}`).set(viewer.auth);
  expect(seenByOther.status).toBe(200);
  expect(seenByOther.body.pan).toBeUndefined();
  expect(seenByOther.body.address).toBeUndefined();
  expect(seenByOther.body.email).toBeUndefined();
  expect(seenByOther.body.password).toBeUndefined();
  expect(seenByOther.body.name).toBe(owner.user.name);
  const seenBySelf = await request(app).get(`/api/users/${owner.user._id}`).set(owner.auth);
  expect(seenBySelf.body.pan).toBe('ABCDE1234F');
});

test('GET /users/seekers is for providers and admins, not seekers', async () => {
  const s = await makeUser('seeker');
  const p = await makeUser('provider');
  expect((await request(app).get('/api/users/seekers').set(s.auth)).status).toBe(403);
  expect((await request(app).get('/api/users/seekers').set(p.auth)).status).toBe(200);
});

test('only admins create skills', async () => {
  const s = await makeUser('seeker');
  const admin = await makeUser('admin');
  expect((await request(app).post('/api/skills').set(s.auth).send({ name: 'X' })).status).toBe(403);
  expect((await request(app).post('/api/skills').set(admin.auth).send({ name: 'Welding' })).status).not.toBe(403);
});

test('documents are private; skills are visible to providers but not to other seekers', async () => {
  const a = await makeUser('seeker');
  const b = await makeUser('seeker');
  const p = await makeUser('provider');
  expect((await request(app).get(`/api/user-documents/${b.user._id}`).set(a.auth)).status).toBe(403);
  expect((await request(app).get(`/api/user-skills/${b.user._id}`).set(a.auth)).status).toBe(403);
  expect((await request(app).get(`/api/user-skills/${b.user._id}`).set(p.auth)).status).toBe(200);
  expect((await request(app).get(`/api/user-skills/${b.user._id}`).set(b.auth)).status).toBe(200);
});

test('only the owner can modify a user skill', async () => {
  const a = await makeUser('seeker');
  const b = await makeUser('seeker');
  const bs = await makeUserSkill(b);
  expect((await request(app).delete(`/api/user-skills/delete-skill/${bs._id}`).set(a.auth)).status).toBe(403);
  expect((await request(app).post(`/api/user-skills/${bs._id}/fetch-pcc`).set(a.auth).send({})).status).toBe(403);
  expect((await request(app).post(`/api/user-skills/${b.user._id}`).set(a.auth).send({})).status).toBe(403);
});

test('verification and assessment results are admin-only, even for your own skill', async () => {
  const a = await makeUser('seeker');
  const admin = await makeUser('admin');
  const as = await makeUserSkill(a);
  expect((await request(app).post(`/api/user-skills/${as._id}/assessment-result`).set(a.auth).send({ result: 'passed' })).status).toBe(403);
  expect((await request(app).patch(`/api/user-skills/${a.user._id}/${as._id}/verify`).set(a.auth)).status).toBe(403);
  expect((await request(app).patch(`/api/user-documents/${a.user._id}/${as._id}/verify`).set(a.auth)).status).toBe(403);
  expect((await request(app).post(`/api/user-skills/${as._id}/assessment-result`).set(admin.auth).send({ result: 'passed' })).status).toBe(200);
});

test('tests can only be assigned or completed by providers/admins', async () => {
  const s = await makeUser('seeker');
  expect((await request(app).post('/api/user-tests/assign').set(s.auth).send({})).status).toBe(403);
  expect((await request(app).patch('/api/user-tests/000000000000000000000001/complete').set(s.auth).send({})).status).toBe(403);
});
