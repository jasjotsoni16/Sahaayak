const express = require('express');
const router = express.Router();
const jobController = require('../controller/jobController');
const { authenticateToken, requireEmployer, requireResourceOwnership } = require('../middleware/authMiddleware');
const { bindBodyToUser } = require('../middleware/auth');
const { validateQuery } = require('../middleware/validate');
const { radiusQuery } = require('../validators/jobSchemas');

// Public routes (for seekers to view jobs)
router.get('/', jobController.getAllJobs);
router.get('/jobs-in-radius', validateQuery(radiusQuery), jobController.getJobsInRadius);
router.get('/employer/:employerId/public', jobController.getPublicJobsByEmployer);

// Protected routes
// employer_id is always the caller: an employer cannot post jobs as someone else
router.post('/', authenticateToken, requireEmployer, bindBodyToUser('employer_id'), jobController.createJob);
router.get('/employer/:employerId', authenticateToken, requireResourceOwnership('employerId'), jobController.getJobsByEmployer);

module.exports = router;
