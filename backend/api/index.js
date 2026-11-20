// Vercel entry point: Vercel calls the exported app for every request (see vercel.json).
// Locally the server still starts from index.js.
require('dotenv').config();
require('../config/env').checkEnv();
const connectDB = require('../config/db');
const { createApp } = require('../app');

// Runs after CORS, so even a database error reaches the browser with the right headers.
const ensureDb = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    res.status(503).json({ error: 'Database unavailable. Please try again shortly.' });
  }
};

module.exports = createApp({ beforeRoutes: [ensureDb] });
