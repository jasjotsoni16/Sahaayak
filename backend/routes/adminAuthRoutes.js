const express = require('express');
const router = express.Router();
const adminAuthController = require('../controller/adminAuthController');

router.post('/login', adminAuthController.login);

module.exports = router;
