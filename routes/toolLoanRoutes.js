const express = require('express');
const router = express.Router();
const toolLoanController = require('../controller/toolLoanController');
const { requireAuth } = require('../middleware/auth');

// Protected routes (require authentication)
router.get('/tool/:toolId/borrower/:borrowerId', requireAuth, toolLoanController.getLoanByToolAndBorrower);
router.post('/', requireAuth, toolLoanController.requestToolLoan);
router.put('/:id/accept', requireAuth, toolLoanController.acceptToolLoan);
router.put('/:id/reject', requireAuth, toolLoanController.rejectToolLoan);
router.put('/:id/confirm-return', requireAuth, toolLoanController.confirmToolReturn);
router.get('/my-loans/borrower/:userId', requireAuth, toolLoanController.getBorrowerLoans);
router.get('/my-loans/lender/:userId', requireAuth, toolLoanController.getLenderLoans);

module.exports = router;
