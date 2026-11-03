const express = require('express');
const router = express.Router();
const ratingController = require('../controller/ratingController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Debug middleware to log all rating requests
router.use((req, res, next) => {
  console.log(`🎯 Rating API Request: ${req.method} ${req.path}`);
  console.log(`📝 Body:`, req.body);
  console.log(`🔑 Headers:`, req.headers.authorization ? 'Token present' : 'No token');
  next();
});

// Create or update a rating
router.post('/', authenticateToken, (req, res, next) => {
  console.log('📝 POST /api/ratings - Creating/updating rating');
  console.log('👤 Authenticated user:', req.user ? req.user._id : 'None');
  next();
}, ratingController.createOrUpdateRating);

// Get a specific rating
router.get('/:jobId/:giverId/:receiverId', authenticateToken, ratingController.getRating);

// Get all ratings for a user (as receiver)
router.get('/user/:userId', authenticateToken, ratingController.getUserRatings);

// Get ratings given by a user
router.get('/given-by/:userId', authenticateToken, ratingController.getRatingsGivenByUser);

module.exports = router;