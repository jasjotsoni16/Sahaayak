const mongoose = require('mongoose');

const userRatingSchema = new mongoose.Schema({
  giver_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comments: {
    type: String,
    required: false,
    maxlength: 1000,
  },
  role_of_giver: {
    type: String,
    enum: ['seeker', 'provider'],
    required: true,
  },
  role_of_receiver: {
    type: String,
    enum: ['seeker', 'provider'],
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true
});

// Virtual fields for backward compatibility
userRatingSchema.virtual('seeker_id').get(function() {
  return this.role_of_giver === 'seeker' ? this.giver_user_id : this.receiver_user_id;
});

userRatingSchema.virtual('employer_id').get(function() {
  return this.role_of_giver === 'provider' ? this.giver_user_id : this.receiver_user_id;
});

userRatingSchema.virtual('feedback').get(function() {
  return this.comments;
});

// Ensure virtuals are included in JSON output
userRatingSchema.set('toJSON', { virtuals: true });
userRatingSchema.set('toObject', { virtuals: true });

// Index for efficient queries
userRatingSchema.index({ giver_user_id: 1, receiver_user_id: 1, job_id: 1 }, { unique: true });
userRatingSchema.index({ receiver_user_id: 1 });
userRatingSchema.index({ job_id: 1 });

module.exports = mongoose.model('UserRating', userRatingSchema);