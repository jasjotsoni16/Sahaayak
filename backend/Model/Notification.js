const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      // Seeker notifications
      'job_match',
      'loan_suggestion',
      'credit_score_update',
      'assessment_assigned',
      'assessment_result',
      // Employer notifications
      'job_application_received',
      'assessment_started',
      'assessment_completed',
      'offer_response',
      'agreement_signed',
      'ai_assessment_complete'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  action_url: {
    type: String,
    default: null
  },
  action_text: {
    type: String,
    default: null
  },
  is_read: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  read_at: {
    type: Date,
    default: null
  }
});

// Index for efficient queries
notificationSchema.index({ user_id: 1, created_at: -1 });
notificationSchema.index({ user_id: 1, is_read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);