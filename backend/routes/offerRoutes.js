const express = require('express');
const router = express.Router();
const offerController = require('../controller/offerController');
const { requireAuth, authorizeRoles } = require('../middleware/auth');

// Create an offer (by employer)
router.post('/', requireAuth, authorizeRoles('provider'), offerController.createOffer);

// Accept an offer (by seeker)
router.put('/:offerId/accept', requireAuth, authorizeRoles('seeker'), offerController.acceptOffer);

// Reject an offer (by seeker)
router.put('/:offerId/reject', requireAuth, authorizeRoles('seeker'), offerController.rejectOffer);

// Counter an offer (by employer or seeker)
router.put('/:offerId/counter', requireAuth, authorizeRoles('provider', 'seeker'), offerController.counterOffer);

// Get offers for a specific seeker
router.get('/seeker/:seekerId', requireAuth, authorizeRoles('seeker'), offerController.getOffersForSeeker);

// Get offers for a specific employer
router.get('/employer/:employerId', requireAuth, authorizeRoles('provider'), offerController.getOffersForEmployer);

module.exports = router;