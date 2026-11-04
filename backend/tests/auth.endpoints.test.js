const request = require('supertest');
const db = require('./helpers/db');
const { createApp } = require('../app');

let app;
beforeAll(async () => { await db.connect(); app = createApp(); });
afterAll(db.close);
beforeEach(db.clear);

const valid = { name: 'Asha', phone_number: '9876543210', password: 'secret123', role: 'seeker' };

test('signup creates a seeker and never returns the password hash', async () => {
  const res = await request(app).post('/api/users/signup').send({ ...valid, city: 'chandigarh' });
  expect(res.status).toBe(201);
  expect(res.body.token).toBeTruthy();
  expect(res.body.user.password).toBeUndefined();
  expect(res.body.user.city).toBe('chandigarh');
});

test('signup refuses role=admin', async () => {
  const res = await request(app).post('/api/users/signup').send({ ...valid, role: 'admin' });
  expect(res.status).toBe(400);
});

test('signup ignores unknown fields such as false_accusation_count', async () => {
  const res = await request(app).post('/api/users/signup')
    .send({ ...valid, false_accusation_count: 99, monthlySavings: 1e9 });
  expect(res.status).toBe(201);
  expect(res.body.user.false_accusation_count).toBe(0);
  expect(res.body.user.monthlySavings).toBe(0);
});

test('signup validates phone and password', async () => {
  const badPhone = await request(app).post('/api/users/signup').send({ ...valid, phone_number: 'abc' });
  expect(badPhone.status).toBe(400);
  const shortPw = await request(app).post('/api/users/signup').send({ ...valid, password: '123' });
  expect(shortPw.status).toBe(400);
});

test('duplicate phone number returns 409', async () => {
  await request(app).post('/api/users/signup').send(valid);
  const again = await request(app).post('/api/users/signup').send(valid);
  expect(again.status).toBe(409);
});

test('login: unknown phone and wrong password give the same 401 body', async () => {
  await request(app).post('/api/users/signup').send(valid);
  const unknown = await request(app).post('/api/users/login').send({ phone_number: '1111111111', password: 'secret123' });
  const wrong = await request(app).post('/api/users/login').send({ phone_number: valid.phone_number, password: 'nope-nope' });
  expect(unknown.status).toBe(401);
  expect(wrong.status).toBe(401);
  expect(unknown.body).toEqual(wrong.body);
});

test('login success returns token and no password', async () => {
  await request(app).post('/api/users/signup').send(valid);
  const res = await request(app).post('/api/users/login').send({ phone_number: valid.phone_number, password: valid.password });
  expect(res.status).toBe(200);
  expect(res.body.token).toBeTruthy();
  expect(res.body.user.password).toBeUndefined();
});

describe('provider signup', () => {
  const provider = {
    name: 'Ravi', phone_number: '9123456780', password: 'secret123', role: 'provider',
    company_name: 'Ravi Traders', company_type: 'business', gstin_number: '22AAAAA0000A1Z5',
  };
  const User = require('../Model/User');
  const Employer = require('../Model/Employer');

  test('valid provider signup creates the user and the employer profile', async () => {
    const res = await request(app).post('/api/users/signup').send(provider);
    expect(res.status).toBe(201);
    expect(await Employer.countDocuments({ user_id: res.body.user._id })).toBe(1);
  });

  test('invalid company details are rejected up front and leave no orphan user', async () => {
    const res = await request(app).post('/api/users/signup').send({ ...provider, company_type: 'Private Limited' });
    expect(res.status).toBe(400);
    expect(await User.countDocuments({ phone_number: provider.phone_number })).toBe(0);
  });

  test('a provider must supply company name, type and GSTIN', async () => {
    const res = await request(app).post('/api/users/signup').send({ ...provider, gstin_number: '' });
    expect(res.status).toBe(400);
    expect(await User.countDocuments()).toBe(0);
  });

  test('if profile creation fails after the user was created, the user is rolled back', async () => {
    await request(app).post('/api/users/signup').send(provider);          // takes the GSTIN
    const clash = await request(app).post('/api/users/signup')
      .send({ ...provider, phone_number: '9123456781' });                   // same GSTIN, new phone
    expect(clash.status).toBe(409);
    expect(await User.countDocuments({ phone_number: '9123456781' })).toBe(0);
  });
});
