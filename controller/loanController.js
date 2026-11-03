const LoanOffer = require('../Model/LoanOffer');
const LoanDisbursal = require('../Model/LoanDisbursal');
const User = require('../Model/User');
const Agreement = require('../Model/Agreement'); // Import Agreement model
const creditScoreService = require('../services/creditScoreService');

// Create a new loan offer
exports.createLoanOffer = async (req, res) => {
  try {
    const { user_id, suggested_amount, purpose, repayment_period_months, interest_rate, score_confidence, status } = req.body;
    const newLoanOffer = new LoanOffer({ user_id, suggested_amount, purpose, repayment_period_months, interest_rate, score_confidence, status });
    const loanOffer = await newLoanOffer.save();
    const creditScore = await creditScoreService.calculateCreditScore(user_id);
    res.status(201).json({ ...loanOffer.toObject(), creditScore });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get loan offers by user ID
exports.getLoanOffersByUserId = async (req, res) => {
  try {
    const loanOffers = await LoanOffer.find({ user_id: req.params.userId })
      .populate('user_id', 'name email')
      .populate('agreement_id')
      .populate({ 
        path: 'user_id',
        populate: {
          path: 'credit_score',
          model: 'CreditScore',
          select: 'score'
        }
      });
    res.status(200).json(loanOffers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all loan offers (for admin)
exports.getAllLoanOffers = async (req, res) => {
  try {
    const loanOffers = await LoanOffer.find()
      .populate('user_id', 'name email')
      .populate('agreement_id')
      .populate({ 
        path: 'user_id',
        populate: {
          path: 'credit_score',
          model: 'CreditScore',
          select: 'score'
        }
      });
    res.status(200).json(loanOffers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single loan offer by ID
exports.getLoanOfferById = async (req, res) => {
  try {
    const loanOffer = await LoanOffer.findById(req.params.id);
    if (!loanOffer) {
      return res.status(404).json({ message: 'Loan offer not found' });
    }
    res.status(200).json(loanOffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update loan offer status
exports.updateLoanOfferStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const loanOffer = await LoanOffer.findById(req.params.id).populate('user_id');

    if (!loanOffer) {
      return res.status(404).json({ message: 'Loan offer not found' });
    }

    // Simply update the status without PDF generation or agreement saving
    loanOffer.status = status;
    await loanOffer.save();

    res.status(200).json(loanOffer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Placeholder for disburseLoan
exports.disburseLoan = async (req, res) => {
  res.status(501).json({ message: 'disburseLoan not implemented' });
};

// Placeholder for getLoanDisbursalById
exports.getLoanDisbursalById = async (req, res) => {
  res.status(501).json({ message: 'getLoanDisbursalById not implemented' });
};

// Placeholder for updateRepaymentStatus
exports.updateRepaymentStatus = async (req, res) => {
  res.status(501).json({ message: 'updateRepaymentStatus not implemented' });
};

// Placeholder for suggestLoanOffer
exports.suggestLoanOffer = async (req, res) => {
  res.status(501).json({ message: 'suggestLoanOffer not implemented' });
};

// Placeholder for suggestLoanToInvestor
exports.suggestLoanToInvestor = async (req, res) => {
  res.status(501).json({ message: 'suggestLoanToInvestor not implemented' });
};