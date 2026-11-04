const express = require('express');
const router = express.Router();
const aiAssessmentController = require('../controller/aiAssessmentController');
const { requireAuth } = require('../middleware/auth');

// Get AI assessment for specific application
router.get('/application/:applicationId', requireAuth, aiAssessmentController.getAIAssessment);

// Get all AI assessments for an employer
router.get('/employer/:employerId', requireAuth, aiAssessmentController.getEmployerAIAssessments);

// Get AI assessment statistics for an employer
router.get('/employer/:employerId/stats', requireAuth, aiAssessmentController.getAIAssessmentStats);

// Manually trigger AI assessment for an application
router.post('/trigger/:applicationId', requireAuth, aiAssessmentController.triggerAIAssessment);

module.exports = router;