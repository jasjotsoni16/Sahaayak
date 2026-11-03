const express = require('express');
const router = express.Router();
const creditScoreController = require('../controller/creditScoreController');
const { requireAuth } = require('../middleware/auth');

// Get credit score for the authenticated user
router.get('/', requireAuth, creditScoreController.getCreditScore);

// Get detailed credit score calculation for authenticated user
router.get('/details', requireAuth, creditScoreController.getCreditScoreDetails);

// Get credit score statistics (admin only)
router.get('/admin/stats', requireAuth, creditScoreController.getCreditScoreStats);

// Trigger immediate credit score update for all users (admin only)
router.post('/admin/update-all', requireAuth, creditScoreController.updateAllCreditScores);

// Trigger immediate credit score update (admin only)
router.post('/admin/trigger-update', requireAuth, creditScoreController.triggerImmediateUpdate);

// Get credit score for a specific user (admin only)
router.get('/:userId', requireAuth, creditScoreController.getCreditScore);

// Get detailed credit score calculation for a specific user
router.get('/:userId/details', requireAuth, creditScoreController.getCreditScoreDetails);

// Update credit score for the authenticated user
router.put('/', requireAuth, creditScoreController.updateCreditScore);

// Update credit score for a specific user (admin only)
router.put('/:userId', requireAuth, creditScoreController.updateCreditScore);

module.exports = router;