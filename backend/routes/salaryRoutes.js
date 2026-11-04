const express = require('express');
const router = express.Router();
const c = require('../controller/salaryController');
const SalaryAgreement = require('../Model/SalaryAgreement');
const { requireAuth, authorizeRoles, loadOwned } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createAgreementSchema, statusSchema, recordPaymentSchema, disputeSchema } = require('../validators/salarySchemas');

router.use(requireAuth);

const employerOwns = loadOwned(SalaryAgreement, { param: 'id', ownerFields: ['employer_id'] });
const employeeOwns = loadOwned(SalaryAgreement, { param: 'id', ownerFields: ['employee_id'] });
const eitherParty = loadOwned(SalaryAgreement, { param: 'id', ownerFields: ['employer_id', 'employee_id'] });

// Employer
router.post('/', authorizeRoles('provider'), validate(createAgreementSchema), c.createAgreement);
router.get('/employer', authorizeRoles('provider'), c.listForEmployer);
router.put('/:id/status', authorizeRoles('provider'), employerOwns, validate(statusSchema), c.updateStatus);
router.post('/:id/payments', authorizeRoles('provider'), employerOwns, validate(recordPaymentSchema), c.recordPayment);

// Employee
router.get('/employee', authorizeRoles('seeker'), c.listForEmployee);
router.post('/:id/payments/:paymentId/confirm', authorizeRoles('seeker'), employeeOwns, c.confirmPayment);
router.post('/:id/payments/:paymentId/dispute', authorizeRoles('seeker'), employeeOwns, validate(disputeSchema), c.disputePayment);

// Either party
router.get('/:id', eitherParty, c.getAgreement);

module.exports = router;
