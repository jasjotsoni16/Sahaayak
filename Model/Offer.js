const mongoose = require('mongoose');

const negotiationHistorySchema = new mongoose.Schema({
  offered_wage: { type: Number, required: true },
  offered_wage_type: { type: String, enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly'], required: true },
  offered_by: { type: String, enum: ['employer', 'seeker'], required: true },
  timestamp: { type: Date, default: Date.now },
});

const offerSchema = new mongoose.Schema({
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  seeker_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  employer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  offered_wage: {
    type: Number,
    required: true,
  },
  offered_wage_type: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'negotiating', 'employer_countered', 'seeker_countered'],
    default: 'pending',
  },
  employer_counter_offer_count: {
    type: Number,
    default: 0,
  },
  seeker_counter_offer_count: {
    type: Number,
    default: 0,
  },
  negotiation_history: [negotiationHistorySchema],
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  agreement_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agreement',
  },
});

// Update updated_at on save
offerSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Offer', offerSchema);