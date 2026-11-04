const mongoose = require('mongoose');

const userApplicationSchema = new mongoose.Schema({
  seeker_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  status: {
    type: String,
    enum: ['applied', 'discussion', 'negotiation', 'hired', 'fired', 'left'],
    default: 'applied',
  },
  date_applied: {
    type: Date,
    default: Date.now,
  },
  date_hired: {
    type: Date,
  },
  date_discussion: {
    type: Date,
  },
  date_negotiation: {
    type: Date,
  },
  date_rejected: {
    type: Date,
  },
  date_left: {
    type: Date,
  },
  date_fired: {
    type: Date,
  },
});

module.exports = mongoose.model('UserApplication', userApplicationSchema, 'user_applications');
