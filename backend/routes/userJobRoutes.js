const express = require('express');
const router = express.Router();
const userJobController = require('../controller/userJobController');
const { requireAuth, authorizeRoles, bindBodyToUser } = require('../middleware/auth');

router.use(requireAuth);

// Seeker routes
router.post('/apply', authorizeRoles('seeker'), bindBodyToUser('seeker_id'), userJobController.applyForJob);
router.post('/negotiate', userJobController.negotiateOffer);
router.post('/recommend', authorizeRoles('seeker'), userJobController.recommendJob);

// Provider routes
router.get('/applications/:job_id', authorizeRoles('provider', 'admin'), userJobController.viewApplications);
router.post('/make-offer', authorizeRoles('provider'), bindBodyToUser('employer_id'), userJobController.makeOffer);

module.exports = router;
