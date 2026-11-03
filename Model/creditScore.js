const mongoose = require('mongoose');

const CreditScoreSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  score: {
    type: Number,
    required: true,
    min: 10,
    max: 100,
  },
  factors: {
    type: Object, // Store an object of factors and their contributions
    default: {},
  },
  last_calculated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.CreditScore || mongoose.model('CreditScore', CreditScoreSchema);