const mongoose = require('mongoose');

const InvestorProposalSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  suggested_amount: {
    type: Number,
    required: true,
  },
  offered_equity_percentage: {
    type: Number,
    required: true,
  },
  business_idea: {
    type: String,
    required: true,
  },
  expected_monthly_revenue: {
    type: Number,
  },
  expected_roi_months: {
    type: Number,
  },
  pitch_video_url: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'accepted', 'rejected', 'funded'],
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

module.exports = mongoose.model('InvestorProposal', InvestorProposalSchema);
