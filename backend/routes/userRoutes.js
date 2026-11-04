const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const { requireAuth, authorizeRoles } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { signupSchema, loginSchema, savingsGoalSchema } = require('../validators/userSchemas');

router.post('/signup', validate(signupSchema), userController.signup);
router.post('/login', validate(loginSchema), userController.login);
router.get('/profile', requireAuth, userController.getProfile);
router.put('/profile', requireAuth, userController.updateProfile);
router.put('/update-language', requireAuth, userController.updateLanguage);
router.get('/me', requireAuth, userController.getCurrentUser);
router.put('/change-language', requireAuth, userController.changeLanguage);
router.put('/profile/notifications', requireAuth, userController.updateNotificationSettings);
router.put('/savings-goal', requireAuth, authorizeRoles('seeker', 'investor'), validate(savingsGoalSchema), userController.updateSavingsGoal);
router.get('/seekers', requireAuth, authorizeRoles('provider', 'admin'), userController.getAllSeekers);
router.get('/:id', requireAuth, userController.getUserById);

module.exports = router;