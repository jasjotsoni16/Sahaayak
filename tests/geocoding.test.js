process.env.GEOCODER = 'nominatim';
process.env.GEOCODER_MIN_INTERVAL_MS = '0';
process.env.GEOCODER_TIMEOUT_MS = '60';

jest.mock('../services/geocoding/providers/nominatim');
const provider = require('../services/geocoding/providers/nominatim');
const db = require('./helpers/db');
const geo = require('../services/geocoding');

const chandigarh = { label: 'Chandigarh, India', city: 'Chandigarh', state: 'Chandigarh', pincode: '160017', lat: 30.7333, lng: 76.7794 };

beforeAll(db.connect);
afterAll(db.close);
beforeEach(async () => { await db.clear(); jest.resetAllMocks(); });

describe('geocode (name -> places)', () => {
  test('returns provider results and caches them regardless of case/spacing', async () => {
    provider.search.mockResolvedValue([chandigarh]);
    expect(await geo.geocode('Chandigarh')).toEqual([chandigarh]);
    expect(await geo.geocode('  chandigarh ')).toEqual([chandigarh]);
    expect(provider.search).toHaveBeenCalledTimes(1);
  });

  test('a provider error returns [] and is NOT cached', async () => {
    provider.search.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce([chandigarh]);
    expect(await geo.geocode('Chandigarh')).toEqual([]);
    expect(await geo.geocode('Chandigarh')).toEqual([chandigarh]);
    expect(provider.search).toHaveBeenCalledTimes(2);
  });

  test('"no such place" is a real answer and is cached', async () => {
    provider.search.mockResolvedValue([]);
    expect(await geo.geocode('Nowhereville')).toEqual([]);
    expect(await geo.geocode('Nowhereville')).toEqual([]);
    expect(provider.search).toHaveBeenCalledTimes(1);
  });

  test('rejects too-short or too-long queries without calling the provider', async () => {
    expect(await geo.geocode('a')).toEqual([]);
    expect(await geo.geocode('x'.repeat(101))).toEqual([]);
    expect(await geo.geocode(undefined)).toEqual([]);
    expect(provider.search).not.toHaveBeenCalled();
  });

  test('a provider that hangs is cut off by the timeout', async () => {
    provider.search.mockReturnValue(new Promise(() => {}));
    const started = Date.now();
    expect(await geo.geocode('Chandigarh')).toEqual([]);
    expect(Date.now() - started).toBeLessThan(1000);
  });
});

describe('reverseGeocode (coordinates -> city)', () => {
  test('returns the place and shares cache between nearby points', async () => {
    provider.reverse.mockResolvedValue(chandigarh);
    expect(await geo.reverseGeocode(30.7333, 76.7794)).toEqual(chandigarh);
    expect(await geo.reverseGeocode(30.73331, 76.77941)).toEqual(chandigarh); // same ~100 m cell
    expect(provider.reverse).toHaveBeenCalledTimes(1);
  });

  test('invalid or out-of-range coordinates return null without calling the provider', async () => {
    for (const [lat, lng] of [[91, 0], [0, 181], ['x', 1], [NaN, 1], [undefined, undefined]]) {
      expect(await geo.reverseGeocode(lat, lng)).toBeNull();
    }
    expect(provider.reverse).not.toHaveBeenCalled();
  });

  test('provider failure returns null', async () => {
    provider.reverse.mockRejectedValue(new Error('down'));
    expect(await geo.reverseGeocode(30.73, 76.77)).toBeNull();
  });
});
