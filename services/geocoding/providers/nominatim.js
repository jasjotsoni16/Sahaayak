// OpenStreetMap Nominatim. Free, no account; usage policy: max 1 request/second, identify the app.
// https://operations.osmfoundation.org/policies/nominatim/
const axios = require('axios');

const BASE = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org';
const HEADERS = { 'User-Agent': 'SahayakApp/1.0 (job platform demo)', 'Accept-Language': 'en' };

const cityOf = (a = {}) => a.city || a.town || a.village || a.municipality || a.county || a.state_district || null;

const normalize = (r) => ({
  label: r.display_name,
  city: cityOf(r.address),
  state: (r.address && r.address.state) || null,
  pincode: (r.address && r.address.postcode) || null,
  lat: Number(r.lat),
  lng: Number(r.lon),
});

exports.search = async (query) => {
  const { data } = await axios.get(`${BASE}/search`, {
    params: { q: query, format: 'jsonv2', addressdetails: 1, limit: 5, countrycodes: 'in' },
    headers: HEADERS, timeout: 5000,
  });
  return data.map(normalize);
};

exports.reverse = async (lat, lng) => {
  const { data } = await axios.get(`${BASE}/reverse`, {
    params: { lat, lon: lng, format: 'jsonv2', addressdetails: 1, zoom: 12 },
    headers: HEADERS, timeout: 5000,
  });
  if (!data || data.error) return null;
  const { lat: _lat, lng: _lng, ...place } = normalize({ ...data, lat, lon: lng });
  return place;
};
