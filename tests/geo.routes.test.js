process.env.GEOCODER = 'nominatim'; // the mocked provider below
process.env.GEOCODER_MIN_INTERVAL_MS = '0';
jest.mock('../services/geocoding/providers/nominatim');
const provider = require('../services/geocoding/providers/nominatim');
const request = require('supertest');
const db = require('./helpers/db');
const { createApp } = require('../app');

const place = { label: 'Chandigarh, India', city: 'Chandigarh', state: 'Chandigarh', pincode: '160017', lat: 30.7333, lng: 76.7794 };
let app;
beforeAll(async () => { await db.connect(); app = createApp(); });
afterAll(db.close);
beforeEach(async () => { await db.clear(); jest.resetAllMocks(); });

describe('GET /api/geo/search', () => {
  test('is public and returns matching places', async () => {
    provider.search.mockResolvedValue([place]);
    const res = await request(app).get('/api/geo/search').query({ q: 'chandigarh' });
    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([place]);
  });

  test('rejects a missing, too-short or too-long query', async () => {
    expect((await request(app).get('/api/geo/search')).status).toBe(400);
    expect((await request(app).get('/api/geo/search').query({ q: 'a' })).status).toBe(400);
    expect((await request(app).get('/api/geo/search').query({ q: 'x'.repeat(101) })).status).toBe(400);
    expect(provider.search).not.toHaveBeenCalled();
  });

  test('a geocoder outage returns an empty list, not an error', async () => {
    provider.search.mockRejectedValue(new Error('down'));
    const res = await request(app).get('/api/geo/search').query({ q: 'chandigarh' });
    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([]);
  });
});

describe('GET /api/geo/reverse', () => {
  test('returns the city for coordinates', async () => {
    provider.reverse.mockResolvedValue({ label: place.label, city: 'Chandigarh', state: 'Chandigarh', pincode: '160017' });
    const res = await request(app).get('/api/geo/reverse').query({ lat: 30.7333, lng: 76.7794 });
    expect(res.status).toBe(200);
    expect(res.body.place.city).toBe('Chandigarh');
  });

  test('rejects missing or out-of-range coordinates', async () => {
    expect((await request(app).get('/api/geo/reverse')).status).toBe(400);
    expect((await request(app).get('/api/geo/reverse').query({ lat: 95, lng: 10 })).status).toBe(400);
    expect((await request(app).get('/api/geo/reverse').query({ lat: 'abc', lng: 10 })).status).toBe(400);
  });

  test('no result gives place: null', async () => {
    provider.reverse.mockResolvedValue(null);
    const res = await request(app).get('/api/geo/reverse').query({ lat: 0, lng: 0 });
    expect(res.status).toBe(200);
    expect(res.body.place).toBeNull();
  });
});
