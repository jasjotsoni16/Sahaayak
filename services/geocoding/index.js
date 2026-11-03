const GeocodeCache = require('../../Model/GeocodeCache');

const DAY_MS = 24 * 60 * 60 * 1000;
const TTL_HIT_MS = 30 * DAY_MS;
const TTL_EMPTY_MS = 1 * DAY_MS; // "no such place" is cached briefly

const providerFor = () => require(`./providers/${process.env.GEOCODER || 'nominatim'}`);
const timeoutMs = () => Number(process.env.GEOCODER_TIMEOUT_MS || 5000);
const minIntervalMs = () => Number(process.env.GEOCODER_MIN_INTERVAL_MS ?? 1100);

const withTimeout = (promise) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('geocoder timed out')), timeoutMs())),
]);

// Serialises provider calls and spaces them out (Nominatim: max 1 request/second).
let queue = Promise.resolve();
let lastCallAt = 0;
const throttled = (fn) => {
  const run = queue.then(async () => {
    const wait = lastCallAt + minIntervalMs() - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCallAt = Date.now();
    return withTimeout(fn()); // the timeout is per provider call, so one hung call cannot stall the queue
  });
  queue = run.catch(() => {});
  return run;
};

const readCache = async (key) => {
  const hit = await GeocodeCache.findOne({ key, expiresAt: { $gt: new Date() } }).lean();
  return hit ? { value: hit.value } : null;
};
const writeCache = (key, value, ttl) =>
  GeocodeCache.updateOne({ key }, { value, expiresAt: new Date(Date.now() + ttl) }, { upsert: true }).catch(() => {});

// name -> places. Never throws: any failure yields [].
exports.geocode = async (query) => {
  if (typeof query !== 'string') return [];
  const q = query.trim().replace(/\s+/g, ' ');
  if (q.length < 2 || q.length > 100) return [];
  const key = `search:${q.toLowerCase()}`;
  try {
    const cached = await readCache(key);
    if (cached) return cached.value;
    const results = await throttled(() => providerFor().search(q));
    await writeCache(key, results, results.length ? TTL_HIT_MS : TTL_EMPTY_MS);
    return results;
  } catch (err) {
    console.warn(`geocode("${q}") failed: ${err.message}`);
    return [];
  }
};

// coordinates -> { label, city, state, pincode } or null. Never throws.
exports.reverseGeocode = async (lat, lng) => {
  const la = typeof lat === 'string' && lat.trim() !== '' ? Number(lat) : lat;
  const lo = typeof lng === 'string' && lng.trim() !== '' ? Number(lng) : lng;
  if (typeof la !== 'number' || typeof lo !== 'number' || !Number.isFinite(la) || !Number.isFinite(lo)
    || la < -90 || la > 90 || lo < -180 || lo > 180) return null;
  const key = `reverse:${la.toFixed(3)},${lo.toFixed(3)}`; // ~100 m cells share an answer
  try {
    const cached = await readCache(key);
    if (cached) return cached.value;
    const place = await throttled(() => providerFor().reverse(la, lo));
    await writeCache(key, place, place ? TTL_HIT_MS : TTL_EMPTY_MS);
    return place;
  } catch (err) {
    console.warn(`reverseGeocode(${la}, ${lo}) failed: ${err.message}`);
    return null;
  }
};

const hasPoint = (loc) => loc && Array.isArray(loc.coordinates) && loc.coordinates.length === 2;

// Fills in whichever of { city, location } is missing, using as few lookups as possible.
// Never throws; whatever cannot be resolved stays null.
exports.resolveLocation = async ({ city, location, latitude, longitude } = {}) => {
  let point = hasPoint(location) ? location : null;
  if (!point && Number.isFinite(latitude) && Number.isFinite(longitude)) {
    point = { type: 'Point', coordinates: [longitude, latitude] };
  }
  let resolvedCity = city || null;

  if (point && !resolvedCity) {
    const place = await exports.reverseGeocode(point.coordinates[1], point.coordinates[0]);
    resolvedCity = (place && place.city) || null;
  } else if (!point && resolvedCity) {
    const [first] = await exports.geocode(resolvedCity);
    if (first) {
      point = { type: 'Point', coordinates: [first.lng, first.lat] };
      resolvedCity = first.city || resolvedCity;
    }
  }
  return { city: resolvedCity, location: point };
};
