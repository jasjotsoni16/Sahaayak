const express = require('express');
const router = express.Router();
const { handleRetellAuth } = require('../controller/retellController');
const { requireAuth } = require('../middleware/auth');

// Creates a Retell web call for the logged-in user
router.post('/auth', requireAuth, handleRetellAuth);

module.exports = router;
