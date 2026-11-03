const mongoose = require('mongoose');

const FDInterestRateSchema = new mongoose.Schema({
  bankName: {
    type: String,
    required: true,
    trim: true,
  },
  tenureDescription: {
    type: String,
    required: true,
  },
  minDays: {
    type: Number,
    required: true,
  },
  maxDays: {
    type: Number,
    required: true,
  },
  generalRate: {
    type: Number,
    required: true,
  },
  seniorRate: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model('FDInterestRate', FDInterestRateSchema);