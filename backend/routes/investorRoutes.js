const express = require('express');
const router = express.Router();
const investorController = require('../controller/investorController');
const { requireAuth } = require('../middleware/auth');
const creditScoreController = require('../controller/creditScoreController');

// Investor Profiles
router.post('/profile', requireAuth, investorController.createInvestorProfile);
router.get('/profile/:userId', requireAuth, investorController.getInvestorProfileByUserId);
router.put('/profile/:userId', requireAuth, investorController.updateInvestorProfile);

// Investor Proposals
router.post('/proposals', requireAuth, investorController.createInvestorProposal);
router.get('/proposals/user/:userId', requireAuth, investorController.getInvestorProposalsByUserId);
router.get('/proposals', requireAuth, investorController.getAllInvestorProposals); // New route for all proposals
router.get('/proposals/:id', requireAuth, investorController.getInvestorProposalById);
router.put('/proposals/:id/status', requireAuth, investorController.updateInvestorProposalStatus);

// AI Suggestion (mock)
router.post('/proposals/suggest', requireAuth, investorController.suggestInvestorProposal);

// Credit Score
router.get('/credit-score/:userId', requireAuth, creditScoreController.getCreditScore);

module.exports = router;
