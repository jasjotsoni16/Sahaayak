const mongoose = require('mongoose');

const InvestorSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  investment_categories: {
    type: [String],
    default: [],
  },
  preferred_equity_range: {
    type: String, // e.g., '0-10%', '10-25%'
  },
  available_funds: {
    type: Number,
  },
  past_investments: [
    {
      proposal_id: { type: mongoose.Schema.Types.ObjectId, ref: 'InvestorProposal' },
      amount_invested: Number,
      roi: Number,
      date_invested: Date,
    },
  ],
  verified: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Investor', InvestorSchema);
