const express = require('express');
const router = express.Router();
const agreementController = require('../controller/agreementController');
const { requireAuth, authorizeRoles } = require('../middleware/auth');

// Get a specific agreement
router.get('/:agreementId', requireAuth, agreementController.getAgreement);

// Sign an agreement
router.put('/:agreementId/sign', requireAuth, agreementController.signAgreement);

module.exports = router;