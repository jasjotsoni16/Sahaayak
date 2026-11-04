const express = require('express');
const router = express.Router();
const userSkillController = require('../controller/userSkillController');
const UserSkill = require('../Model/UserSkill');
const { requireAuth, authorizeRoles, requireSelfOrAdmin, requireSelfOrRole, loadOwned } = require('../middleware/auth');

router.use(requireAuth);

const ownsSkill = loadOwned(UserSkill, { param: 'skillId', ownerFields: ['user_id'] });

// Employers may read an applicant's skills; only the owner (or an admin) may change them.
router.get('/:userId', requireSelfOrRole('userId', 'provider'), userSkillController.getUserSkills);
router.post('/:userId', requireSelfOrAdmin('userId'), userSkillController.addUserSkill);
router.delete('/delete-skill/:skillId', ownsSkill, userSkillController.removeUserSkill);
router.patch('/:userId/:skillId/verify', authorizeRoles('admin'), userSkillController.verifyUserSkill);

// Assessment and verification routes (:skillId is a UserSkill id)
router.post('/:skillId/upload-certificate', ownsSkill, userSkillController.uploadCertificate);
router.post('/:skillId/fetch-pcc', ownsSkill, userSkillController.fetchPCCFromDigiLocker);
router.post('/:skillId/fetch-certificate', ownsSkill, userSkillController.fetchCertificateFromDigiLocker);
router.post('/:skillId/trigger-assessment', ownsSkill, userSkillController.triggerAssessment);
// A client must not be able to mark its own skill as passed
router.post('/:skillId/assessment-result', authorizeRoles('admin'), userSkillController.setAssessmentResult);

module.exports = router;
