const request = require('supertest');
const db = require('./helpers/db');
const { makeUser } = require('./helpers/auth');
const { createApp } = require('../app');

let app;
beforeAll(async () => { await db.connect(); app = createApp(); });
afterAll(db.close);
beforeEach(db.clear);

test('employer applications list: only that employer or admin', async () => {
  const emp = await makeUser('provider');
  const other = await makeUser('provider');
  expect((await request(app).get(`/api/applications/employer/${emp.user._id}`).set(other.auth)).status).toBe(403);
  expect((await request(app).get(`/api/applications/employer/${emp.user._id}`).set(emp.auth)).status).toBe(200);
});

test('seeker applications list: only that seeker or admin', async () => {
  const a = await makeUser('seeker');
  const b = await makeUser('seeker');
  expect((await request(app).get(`/api/applications/seeker/${b.user._id}`).set(a.auth)).status).toBe(403);
  expect((await request(app).get(`/api/applications/seeker/${a.user._id}`).set(a.auth)).status).toBe(200);
});

test('only seekers can apply', async () => {
  const emp = await makeUser('provider');
  const res = await request(app).post('/api/applications').set(emp.auth).send({ job_id: '000000000000000000000001' });
  expect(res.status).toBe(403);
});

test('only providers can update application status or make offers', async () => {
  const s = await makeUser('seeker');
  expect((await request(app).put('/api/applications/000000000000000000000001').set(s.auth).send({ status: 'accepted' })).status).toBe(403);
  expect((await request(app).post('/api/user-jobs/make-offer').set(s.auth).send({})).status).toBe(403);
});

test('hired / archived seekers lists: only that employer or admin', async () => {
  const emp = await makeUser('provider');
  const other = await makeUser('provider');
  for (const p of ['hired-seekers', 'archived-seekers']) {
    expect((await request(app).get(`/api/user-experiences/${p}/${emp.user._id}`).set(other.auth)).status).toBe(403);
  }
});

test('a new job always belongs to the employer who posted it, whatever employer_id says', async () => {
  const emp = await makeUser('provider');
  const victim = await makeUser('provider');
  const res = await request(app).post('/api/jobs').set(emp.auth).send({
    employer_id: String(victim.user._id), title: 'Cook', description: 'Cook for a canteen',
    number_of_openings: 1, job_type: 'full_time', wage_type: 'monthly', salary_min: 100, salary_max: 200,
    city: 'Chandigarh', location: { type: 'Point', coordinates: [76.78, 30.73] },
  });
  expect(res.status).toBeLessThan(300);
  const job = res.body.job || res.body;
  expect(String(job.employer_id)).toBe(String(emp.user._id));
});

test('the public job list is newest first and carries the business name', async () => {
  const Job = require('../Model/Job');
  const Employer = require('../Model/Employer');
  const emp = await makeUser('provider');
  await Employer.collection.insertOne({ user_id: emp.user._id, company_name: 'Sharma Canteen' });
  const base = {
    employer_id: emp.user._id, description: 'd', number_of_openings: 1, job_type: 'gig', wage_type: 'daily',
    salary_min: 1, salary_max: 2, city: 'Chandigarh', location: { type: 'Point', coordinates: [76.78, 30.73] },
  };
  await Job.create({ ...base, title: 'Older', createdAt: new Date('2026-01-01') });
  await Job.create({ ...base, title: 'Newer', createdAt: new Date('2026-06-01') });
  const res = await request(app).get('/api/jobs');
  expect(res.status).toBe(200);
  expect(res.body.map((j) => j.title)).toEqual(['Newer', 'Older']);
  expect(res.body[0].employer_id.employer_profile.company_name).toBe('Sharma Canteen');
});
