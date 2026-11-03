const mongoose = require('mongoose');

const aiAssessmentSchema = new mongoose.Schema({
  seeker_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  employer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  application_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserApplication',
    required: true
  },
  
  // Overall Assessment
  total_score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  recommendation: {
    type: String,
    enum: ['STRONGLY RECOMMENDED', 'TAKE A CHANCE', 'RISKY', 'NOT RECOMMENDED'],
    required: true
  },
  confidence: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    required: true
  },
  
  // Detailed Breakdown
  skills_assessment: {
    score: { type: Number, required: true },
    weight: { type: Number, required: true },
    details: { type: mongoose.Schema.Types.Mixed }
  },
  experience_assessment: {
    score: { type: Number, required: true },
    weight: { type: Number, required: true },
    details: { type: mongoose.Schema.Types.Mixed }
  },
  assessment_history: {
    score: { type: Number, required: true },
    weight: { type: Number, required: true },
    details: { type: mongoose.Schema.Types.Mixed }
  },
  reliability_assessment: {
    score: { type: Number, required: true },
    weight: { type: Number, required: true },
    details: { type: mongoose.Schema.Types.Mixed }
  },
  credit_assessment: {
    score: { type: Number, required: true },
    weight: { type: Number, required: true },
    details: { type: mongoose.Schema.Types.Mixed }
  },
  
  // Analysis Results
  strengths: [{ type: String }],
  concerns: [{ type: String }],
  suggestions: [{ type: String }],
  
  // Metadata
  ai_version: {
    type: String,
    default: '1.0'
  },
  processing_time_ms: {
    type: Number
  },
  
  // Status
  status: {
    type: String,
    enum: ['completed', 'failed', 'processing'],
    default: 'completed'
  },
  error_message: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
aiAssessmentSchema.index({ seeker_id: 1, job_id: 1 });
aiAssessmentSchema.index({ employer_id: 1, createdAt: -1 });
aiAssessmentSchema.index({ application_id: 1 });
aiAssessmentSchema.index({ recommendation: 1 });

module.exports = mongoose.model('AIAssessment', aiAssessmentSchema);