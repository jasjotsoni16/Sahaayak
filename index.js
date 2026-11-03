require('dotenv').config();
require('./config/env').checkEnv();
const connectDB = require('./config/db');
const { createApp } = require('./app');
const creditScoreScheduler = require('./services/creditScoreScheduler');
const jobRecommendationScheduler = require('./services/jobRecommendationScheduler');

connectDB()
  .then(() => {
    const app = createApp();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      creditScoreScheduler.start();
      jobRecommendationScheduler.start();
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
