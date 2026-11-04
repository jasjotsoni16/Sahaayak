process.env.GEOCODER = 'nominatim'; // the mocked provider below
process.env.GEOCODER_MIN_INTERVAL_MS = '0';
jest.mock('../services/geocoding/providers/nominatim');
const provider = require('../services/geocoding/providers/nominatim');
const request = require('supertest');
const db = require('./helpers/db');
const { makeUser } = require('./helpers/auth');
const { createApp } = require('../app');
const User = require('../Model/User');
const geo = require('../services/geocoding');

const chandigarh = { label: 'Chandigarh, India', city: 'Chandigarh', state: 'Chandigarh', pincode: '160017', lat: 30.7333, lng: 76.7794 };
const base = { name: 'Asha', phone_number: '9876543210', password: 'secret123', role: 'seeker' };

let app;
beforeAll(async () => { await db.connect(); app = createApp(); });
afterAll(db.close);
beforeEach(async () => { await db.clear(); jest.resetAllMocks(); });

describe('resolveLocation', () => {
  test('city only -> coordinates and the proper city name', async () => {
    provider.search.mockResolvedValue([chandigarh]);
    expect(await geo.resolveLocation({ city: 'chandigarh' })).toEqual({
      city: 'Chandigarh', location: { type: 'Point', coordinates: [76.7794, 30.7333] },
    });
  });

  test('coordinates only -> city', async () => {
    provider.reverse.mockResolvedValue({ city: 'Chandigarh' });
    const r = await geo.resolveLocation({ latitude: 30.7333, longitude: 76.7794 });
    expect(r).toEqual({ city: 'Chandigarh', location: { type: 'Point', coordinates: [76.7794, 30.7333] } });
  });

  test('everything supplied -> nothing is looked up', async () => {
    const location = { type: 'Point', coordinates: [76.1, 30.1] };
    expect(await geo.resolveLocation({ city: 'Ludhiana', location })).toEqual({ city: 'Ludhiana', location });
    expect(provider.search).not.toHaveBeenCalled();
    expect(provider.reverse).not.toHaveBeenCalled();
  });

  test('lookup failures degrade gracefully', async () => {
    provider.search.mockRejectedValue(new Error('down'));
    expect(await geo.resolveLocation({ city: 'Chandigarh' })).toEqual({ city: 'Chandigarh', location: null });
    expect(await geo.resolveLocation({})).toEqual({ city: null, location: null });
  });
});

describe('signup', () => {
  test('a typed city gets real coordinates and the proper name', async () => {
    provider.search.mockResolvedValue([chandigarh]);
    const res = await request(app).post('/api/users/signup').send({ ...base, city: 'chandigarh' });
    expect(res.status).toBe(201);
    const u = await User.findById(res.body.user._id);
    expect(u.city).toBe('Chandigarh');
    expect(u.location.coordinates).toEqual([76.7794, 30.7333]);
  });

  test('"Auto" location (a point, no city) gets its city from reverse geocoding', async () => {
    provider.reverse.mockResolvedValue({ city: 'Chandigarh' });
    const res = await request(app).post('/api/users/signup')
      .send({ ...base, location: { type: 'Point', coordinates: [76.7794, 30.7333] } });
    expect(res.status).toBe(201);
    expect((await User.findById(res.body.user._id)).city).toBe('Chandigarh');
  });

  test('a geocoder outage never blocks signup', async () => {
    provider.search.mockRejectedValue(new Error('down'));
    const res = await request(app).post('/api/users/signup').send({ ...base, city: 'Chandigarh' });
    expect(res.status).toBe(201);
    const u = await User.findById(res.body.user._id);
    expect(u.city).toBe('Chandigarh');
    expect(u.location).toBeUndefined();
  });
});

describe('job creation', () => {
  const job = (extra = {}) => ({
    title: 'Cook', description: 'Cook for a canteen', number_of_openings: 1, job_type: 'full_time',
    wage_type: 'monthly', salary_min: 100, salary_max: 200,
    location: { type: 'Point', coordinates: [76.7794, 30.7333] }, ...extra,
  });

  test('city comes from the coordinates when not supplied', async () => {
    provider.reverse.mockResolvedValue({ city: 'Chandigarh' });
    const emp = await makeUser('provider');
    const res = await request(app).post('/api/jobs').set(emp.auth).send(job());
    expect(res.status).toBe(201);
    expect(res.body.job.city).toBe('Chandigarh');
  });

  test('a supplied city is used without any lookup', async () => {
    const emp = await makeUser('provider');
    const res = await request(app).post('/api/jobs').set(emp.auth).send(job({ city: 'Mohali' }));
    expect(res.status).toBe(201);
    expect(res.body.job.city).toBe('Mohali');
    expect(provider.reverse).not.toHaveBeenCalled();
  });

  test('if the city cannot be determined the employer is asked for it, not given "Unknown City"', async () => {
    provider.reverse.mockRejectedValue(new Error('down'));
    const emp = await makeUser('provider');
    const res = await request(app).post('/api/jobs').set(emp.auth).send(job());
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/city/i);
  });
});
