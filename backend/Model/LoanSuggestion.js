
const mongoose = require('mongoose');

const loanSuggestionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  skillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true,
  },
  skillName: {
    type: String,
    required: true,
  },
  businessName: {
    type: String,
    required: true,
  },
  businessPurpose: {
    type: String,
    required: true,
  },
  suggestedAmount: {
    type: Number,
    required: true,
  },
  loanTermYears: {
    type: Number,
    required: true,
    default: 5, // Fixed at 5 years as per request
  },
  interestRate: {
    type: Number,
    required: true,
    default: 0.10, // Example fixed interest rate (10%)
  },
  creditScoreAtSuggestion: {
    type: Number,
  },
  monthlySavingsAtSuggestion: {
    type: Number,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const LoanSuggestion = mongoose.model('LoanSuggestion', loanSuggestionSchema);

module.exports = LoanSuggestion;
