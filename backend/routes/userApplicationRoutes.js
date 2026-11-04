const express = require('express');
const router = express.Router();
const userApplicationController = require('../controller/userApplicationController');
const { requireAuth, authorizeRoles, requireSelfOrAdmin, bindBodyToUser } = require('../middleware/auth');

router.use(requireAuth);

// seeker_id is forced to the caller so one seeker cannot apply on behalf of another
router.post('/', authorizeRoles('seeker'), bindBodyToUser('seeker_id'), userApplicationController.createApplication);
router.put('/:id', authorizeRoles('provider', 'admin'), userApplicationController.updateApplicationStatus);
router.get('/employer/:employerId', requireSelfOrAdmin('employerId'), userApplicationController.getApplicationsByEmployer);
router.get('/seeker/:seekerId', requireSelfOrAdmin('seekerId'), userApplicationController.getApplicationsBySeeker);

module.exports = router;
