const mongoose = require('mongoose');
const request = require('supertest');
const db = require('./helpers/db');
const { makeUser } = require('./helpers/auth');
const { hire } = require('./helpers/hire');
const { createApp } = require('../app');
const creditScoreService = require('../services/creditScoreService');
const SalaryAgreement = require('../Model/SalaryAgreement');
const User = require('../Model/User');

let app;
beforeAll(async () => { await db.connect(); app = createApp(); });
afterAll(db.close);
beforeEach(db.clear);

describe('savings goal lives on the user', () => {
  test('a seeker can set it and it is stored on the user', async () => {
    const sk = await makeUser('seeker');
    const res = await request(app).put('/api/users/savings-goal').set(sk.auth).send({ monthly_savings_goal: 5000 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ monthly_savings_goal: 5000 });
    expect((await User.findById(sk.user._id)).monthlySavings).toBe(5000);
  });

  test('rejects negative or non-numeric goals; employers cannot set one', async () => {
    const sk = await makeUser('seeker'); const emp = await makeUser('provider');
    expect((await request(app).put('/api/users/savings-goal').set(sk.auth).send({ monthly_savings_goal: -1 })).status).toBe(400);
    expect((await request(app).put('/api/users/savings-goal').set(sk.auth).send({ monthly_savings_goal: 'x' })).status).toBe(400);
    expect((await request(app).put('/api/users/savings-goal').set(emp.auth).send({ monthly_savings_goal: 100 })).status).toBe(403);
  });
});

describe('credit score without a wallet', () => {
  const agreementFor = async (emp, sk, amount, status) => {
    const a = await SalaryAgreement.create({ employer_id: emp.user._id, employee_id: sk.user._id, amount, frequency: 'monthly' });
    a.payments.push({ amount, status });
    await a.save();
  };

  test('savings goal score comes from the user profile; there is no savings-balance component', async () => {
    const sk = await makeUser('seeker', { monthlySavings: 5000 });
    const r = await creditScoreService.calculateCreditScore(sk.user._id);
    expect(r.components.savingsGoal).toBe(10);           // 5 + 2 + 3
    expect(r.components).not.toHaveProperty('savingsBalance');
  });

  test('only confirmed salary counts towards the salary score', async () => {
    const emp = await makeUser('provider');
    const unconfirmed = await makeUser('seeker'); const confirmed = await makeUser('seeker');
    await agreementFor(emp, unconfirmed, 30000, 'recorded');
    await agreementFor(emp, confirmed, 30000, 'confirmed');
    expect((await creditScoreService.calculateCreditScore(unconfirmed.user._id)).components.salaryScore).toBe(0);
    expect((await creditScoreService.calculateCreditScore(confirmed.user._id)).components.salaryScore).toBe(11); // 3 + 3 + 5
  });

  test('disputed salary does not count', async () => {
    const emp = await makeUser('provider'); const sk = await makeUser('seeker');
    await agreementFor(emp, sk, 30000, 'disputed');
    expect((await creditScoreService.calculateCreditScore(sk.user._id)).components.salaryScore).toBe(0);
  });
});

describe('the wallet is gone', () => {
  test('no wallet or payment models are registered', () => {
    for (const name of ['Wallet', 'WalletTransaction', 'Transaction', 'RecurringPayment', 'UserBankDetails']) {
      expect(mongoose.modelNames()).not.toContain(name);
    }
  });

  test('signup does not create a wallet and wallet routes no longer exist', async () => {
    const res = await request(app).post('/api/users/signup').send({ name: 'Asha', phone_number: '9876543210', password: 'secret123', role: 'seeker' });
    expect(res.status).toBe(201);
    expect(await mongoose.connection.db.listCollections({ name: 'wallets' }).toArray()).toHaveLength(0);
    const w = await request(app).get('/api/wallet').set({ Authorization: `Bearer ${res.body.token}` });
    expect(w.status).toBe(404);
  });
});
