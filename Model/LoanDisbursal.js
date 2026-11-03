const mongoose = require('mongoose');

const LoanDisbursalSchema = new mongoose.Schema({
  loan_offer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoanOffer',
    required: true,
  },
  disbursed_amount: {
    type: Number,
    required: true,
  },
  disbursed_date: {
    type: Date,
    default: Date.now,
  },
  repayment_due_date: {
    type: Date,
    required: true,
  },
  repayment_status: {
    type: String,
    enum: ['due', 'paid', 'overdue'],
    default: 'due',
  },
  payment_schedule: [
    {
      due_date: { type: Date, required: true },
      amount: { type: Number, required: true },
      status: { type: String, enum: ['due', 'paid', 'overdue'], default: 'due' },
    },
  ],
});

module.exports = mongoose.model('LoanDisbursal', LoanDisbursalSchema);
