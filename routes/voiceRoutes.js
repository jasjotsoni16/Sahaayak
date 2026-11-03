
const express = require('express');
const router = express.Router();
const voiceController = require('../controller/voiceController');
const { requireAuth } = require('../middleware/auth');

router.post('/command', requireAuth, voiceController.handleCommand);

module.exports = router;
