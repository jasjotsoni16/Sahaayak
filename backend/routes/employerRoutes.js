const express = require('express');
const router = express.Router();
const employerController = require('../controller/employerController');
const { authenticateToken, requireEmployer } = require('../middleware/authMiddleware');

// Create employer profile
router.post('/', authenticateToken, requireEmployer, employerController.createEmployerProfile);

// Get employer profile
router.get('/', authenticateToken, requireEmployer, employerController.getEmployerProfile);

// Update employer profile
router.put('/', authenticateToken, requireEmployer, employerController.updateEmployerProfile);

// Verify employer GSTIN (admin/internal use)
router.post('/verify-gstin', authenticateToken, requireEmployer, employerController.verifyEmployerGSTIN);

// Get employer by user ID (any logged-in user may view an employer profile)
router.get('/user/:userId', authenticateToken, employerController.getEmployerByUserId);

// Debug route to test authentication
router.get('/debug/auth', authenticateToken, (req, res) => {
  res.json({
    message: 'Authentication successful',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    },
    timestamp: new Date().toISOString()
  });
});

// Debug route to test employer role
router.get('/debug/employer', authenticateToken, requireEmployer, (req, res) => {
  res.json({
    message: 'Employer authentication successful',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;