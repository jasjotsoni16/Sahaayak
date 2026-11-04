const express = require('express');
const router = express.Router();
const userTestController = require('../controller/userTestController');
const { requireAuth, authorizeRoles } = require('../middleware/auth');

router.use(requireAuth, authorizeRoles('provider', 'admin'));

router.post('/assign', userTestController.assignTest);
router.patch('/:testId/complete', userTestController.completeTest);

module.exports = router; 