const mongoose = require('mongoose');

const LoanOfferSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  suggested_amount: {
    type: Number,
    required: true,
  },
  purpose: {
    type: String,
    required: true,
  },
  repayment_period_months: {
    type: Number,
    required: true,
  },
  interest_rate: {
    type: Number,
    required: true,
  },
  score_confidence: {
    type: Number, // e.g., 0.0 to 1.0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'disbursed', 'repaid'],
    default: 'pending',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  agreement_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agreement',
  },
});

module.exports = mongoose.model('LoanOffer', LoanOfferSchema);
