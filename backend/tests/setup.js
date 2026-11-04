// Runs before every test file. OPENAI_API_KEY must be set because some services
// construct the OpenAI / Retell clients at require time and throw without a key.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123456';
process.env.OPENAI_API_KEY = 'test-key';
process.env.RETELL_API_KEY = 'test-key';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.AUTH_RATE_LIMIT_MAX = '1000';
process.env.GEOCODER = 'none'; // never call a real geocoder from tests
process.env.GEOCODER_MIN_INTERVAL_MS = '0';
