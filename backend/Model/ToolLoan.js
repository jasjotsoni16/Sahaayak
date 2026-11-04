const mongoose = require('mongoose');

const ToolLoanSchema = new mongoose.Schema({
  tool_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tool',
    required: true,
  },
  borrower_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  start_date: {
    type: Date,
    required: true,
  },
  end_date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'ongoing', 'completed', 'cancelled'],
    default: 'pending',
  },
  agreed_price: {
    type: Number,
    required: true,
  },
  deposit_paid: {
    type: Boolean,
    default: false,
  },
  return_confirmed: {
    type: Boolean,
    default: false,
  },
  ratings: {
    lender_rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    borrower_rating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  agreement_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agreement',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ToolLoan', ToolLoanSchema);
