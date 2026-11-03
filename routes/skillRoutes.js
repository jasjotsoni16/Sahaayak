const express = require('express');
const router = express.Router();
const skillController = require('../controller/skillController');
const { requireAuth, authorizeRoles } = require('../middleware/auth');

router.get('/', skillController.getAllSkills);
router.post('/', requireAuth, authorizeRoles('admin'), skillController.createSkill);

module.exports = router; 