const express = require('express');
const router = express.Router();
const userExperienceController = require('../controller/userExperienceController');
const { requireAuth, authorizeRoles, requireSelfOrAdmin } = require('../middleware/auth');



router.post('/', requireAuth, authorizeRoles('seeker'), userExperienceController.addExperience);
router.get('/current-jobs/:seekerId', requireAuth, authorizeRoles('seeker'), userExperienceController.getCurrentJobs);
router.put('/leave-job/:experienceId', requireAuth, authorizeRoles('seeker'), userExperienceController.leaveJob);
router.post('/raise-issue/:experienceId', requireAuth, authorizeRoles('seeker'), userExperienceController.raiseIssue);
router.get('/hired-seekers/:employerId', requireAuth, requireSelfOrAdmin('employerId'), userExperienceController.getHiredSeekers);
router.get('/archived-seekers/:employerId', requireAuth, requireSelfOrAdmin('employerId'), userExperienceController.getArchivedSeekers);
router.get('/previous-jobs/:seekerId', requireAuth, authorizeRoles('seeker'), userExperienceController.getAllUserExperiencesForSeeker);


module.exports = router;