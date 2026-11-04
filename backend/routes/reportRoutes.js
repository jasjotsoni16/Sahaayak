const express = require('express');
const router = express.Router();
const reportController = require('../controller/reportController');
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth, reportController.createReport);
router.get('/', requireAuth, reportController.getAllReports); // Admin only
router.put('/:id/status', requireAuth, reportController.updateReportStatus); // Admin only

module.exports = router;
