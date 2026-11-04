const request = require('supertest');
const db = require('./helpers/db');
const { makeUser } = require('./helpers/auth');
const { hire } = require('./helpers/hire');
const { createApp } = require('../app');

let app;
beforeAll(async () => { await db.connect(); app = createApp(); });
afterAll(db.close);
beforeEach(db.clear);

const agreement = (emp, sk, over = {}) => ({ employee_id: String(sk.user._id), amount: 15000, frequency: 'monthly', description: 'Monthly salary', ...over });
const setup = async () => {
  const emp = await makeUser('provider'); const sk = await makeUser('seeker');
  await hire(emp, sk);
  return { emp, sk };
};
const create = async (emp, sk, over) => (await request(app).post('/api/salary').set(emp.auth).send(agreement(emp, sk, over)));

describe('creating agreements', () => {
  test('an employer can create one for a seeker who worked for them', async () => {
    const { emp, sk } = await setup();
    const res = await create(emp, sk);
    expect(res.status).toBe(201);
    expect(res.body.agreement.amount).toBe(15000);
    expect(res.body.agreement.status).toBe('active');
    expect(new Date(res.body.agreement.next_due_date).getTime()).toBeGreaterThan(Date.now());
  });

  test('refused for a seeker who never worked for this employer', async () => {
    const emp = await makeUser('provider'); const stranger = await makeUser('seeker');
    expect((await create(emp, stranger)).status).toBe(403);
  });

  test('seekers cannot create agreements, and employee must be a seeker', async () => {
    const { emp, sk } = await setup();
    expect((await request(app).post('/api/salary').set(sk.auth).send(agreement(emp, sk))).status).toBe(403);
    expect((await create(emp, emp)).status).toBeGreaterThanOrEqual(400);
  });

  test('validates amount and frequency', async () => {
    const { emp, sk } = await setup();
    expect((await create(emp, sk, { amount: -5 })).status).toBe(400);
    expect((await create(emp, sk, { amount: 0 })).status).toBe(400);
    expect((await create(emp, sk, { frequency: 'minutes' })).status).toBe(400);
    expect((await create(emp, sk, { amount: 'lots' })).status).toBe(400);
  });
});

describe('recording and confirming salary', () => {
  test('employer records a payment, seeker confirms it', async () => {
    const { emp, sk } = await setup();
    const id = (await create(emp, sk)).body.agreement._id;
    const before = (await request(app).get(`/api/salary/${id}`).set(emp.auth)).body.agreement.next_due_date;

    const rec = await request(app).post(`/api/salary/${id}/payments`).set(emp.auth).send({ note: 'October' });
    expect(rec.status).toBe(201);
    expect(rec.body.payment.amount).toBe(15000);          // defaults to the agreed amount
    expect(rec.body.payment.status).toBe('recorded');
    expect(new Date(rec.body.agreement.next_due_date).getTime()).toBeGreaterThan(new Date(before).getTime());

    const conf = await request(app).post(`/api/salary/${id}/payments/${rec.body.payment._id}/confirm`).set(sk.auth);
    expect(conf.status).toBe(200);
    expect(conf.body.payment.status).toBe('confirmed');
    // confirming twice is harmless
    expect((await request(app).post(`/api/salary/${id}/payments/${rec.body.payment._id}/confirm`).set(sk.auth)).status).toBe(200);
  });

  test('only the employee confirms; only the employer records', async () => {
    const { emp, sk } = await setup();
    const other = await makeUser('seeker');
    const id = (await create(emp, sk)).body.agreement._id;
    expect((await request(app).post(`/api/salary/${id}/payments`).set(sk.auth).send({})).status).toBe(403);
    const rec = await request(app).post(`/api/salary/${id}/payments`).set(emp.auth).send({});
    const url = `/api/salary/${id}/payments/${rec.body.payment._id}/confirm`;
    expect((await request(app).post(url).set(emp.auth)).status).toBe(403);
    expect((await request(app).post(url).set(other.auth)).status).toBe(403);
  });

  test('a seeker can dispute a payment, but not one already confirmed', async () => {
    const { emp, sk } = await setup();
    const id = (await create(emp, sk)).body.agreement._id;
    const a = await request(app).post(`/api/salary/${id}/payments`).set(emp.auth).send({});
    const b = await request(app).post(`/api/salary/${id}/payments`).set(emp.auth).send({});
    const dis = await request(app).post(`/api/salary/${id}/payments/${a.body.payment._id}/dispute`).set(sk.auth).send({ reason: 'Not received' });
    expect(dis.status).toBe(200);
    expect(dis.body.payment.status).toBe('disputed');
    await request(app).post(`/api/salary/${id}/payments/${b.body.payment._id}/confirm`).set(sk.auth);
    expect((await request(app).post(`/api/salary/${id}/payments/${b.body.payment._id}/dispute`).set(sk.auth).send({ reason: 'x' })).status).toBe(400);
  });

  test('ended or paused agreements cannot record payments', async () => {
    const { emp, sk } = await setup();
    const id = (await create(emp, sk)).body.agreement._id;
    expect((await request(app).put(`/api/salary/${id}/status`).set(emp.auth).send({ status: 'ended' })).status).toBe(200);
    expect((await request(app).post(`/api/salary/${id}/payments`).set(emp.auth).send({})).status).toBe(400);
    expect((await request(app).put(`/api/salary/${id}/status`).set(emp.auth).send({ status: 'bogus' })).status).toBe(400);
  });
});

describe('visibility', () => {
  test('lists are role-scoped and private', async () => {
    const { emp, sk } = await setup();
    const other = await makeUser('provider');
    const id = (await create(emp, sk)).body.agreement._id;
    expect((await request(app).get('/api/salary/employer').set(emp.auth)).body.agreements).toHaveLength(1);
    expect((await request(app).get('/api/salary/employer').set(other.auth)).body.agreements).toHaveLength(0);
    expect((await request(app).get('/api/salary/employee').set(sk.auth)).body.agreements).toHaveLength(1);
    expect((await request(app).get('/api/salary/employee').set(emp.auth)).status).toBe(403);
    expect((await request(app).get(`/api/salary/${id}`).set(other.auth)).status).toBe(403);
    expect((await request(app).get(`/api/salary/${id}`).set(sk.auth)).status).toBe(200);
  });
});
