const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  reporter_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reported_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reported_job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  },
  reported_tool_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tool',
  },
  report_type: {
    type: String,
    enum: ['user', 'job', 'tool', 'other'],
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'rejected', 'false_accusation', 'misunderstanding', 'abuse_true'],
    default: 'pending',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  resolved_at: {
    type: Date,
  },
  resolved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

module.exports = mongoose.model('Report', ReportSchema);
