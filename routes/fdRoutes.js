const express = require('express');
const router = express.Router();
const fdController = require('../controller/fdController');
const { requireAuth } = require('../middleware/auth');

router.get('/interest-rate', requireAuth, fdController.getFDInterestRate);
router.get('/banks', requireAuth, fdController.getBankList);

module.exports = router;