const express = require('express');
const router = express.Router();
const assessmentController = require('../controller/assessmentController');
const { requireAuth } = require('../middleware/auth');

// Assign assessment to user
router.post('/assign', requireAuth, assessmentController.assignAssessment);

// Get user assessments
router.get('/user/:user_id', requireAuth, assessmentController.getUserAssessments);

// Start assessment
router.post('/:assessment_id/start', requireAuth, assessmentController.startAssessment);

// Submit answer
router.post('/:assessment_id/answer', requireAuth, assessmentController.submitAnswer);

// Complete assessment
router.post('/:assessment_id/complete', requireAuth, assessmentController.completeAssessment);

// Get assessment results
router.get('/:assessment_id/results', requireAuth, assessmentController.getAssessmentResults);

// Get assessments for a job
router.get('/job/:job_id', requireAuth, assessmentController.getJobAssessments);

// Create general skill assessment
router.post('/create-skill-assessment', requireAuth, assessmentController.createSkillAssessment);

// Get filtered assessments
router.get('/filtered', requireAuth, assessmentController.getFilteredAssessments);

module.exports = router;