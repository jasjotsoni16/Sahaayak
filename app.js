const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { mountRoutes } = require('./routes');
const { authLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  // cross-origin resource policy relaxed so the React app on :3000 can show /uploads images
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const origins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',').map((s) => s.trim()).filter(Boolean);
  app.use(cors({ origin: origins }));
  app.use(express.json({ limit: '1mb' }));

  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  app.use(['/api/users/login', '/api/users/signup', '/api/admin/login'], authLimiter);

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  mountRoutes(app);

  app.post('/api/frontend-log', (req, res) => {
    console.log('Frontend Log:', { ...req.body, timestamp: new Date().toISOString() });
    res.status(200).send({ success: true });
  });
  app.get('/', (req, res) => res.status(200).send('✅ Auth Server Running'));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
