const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  url: String, // Link to uploaded file or DigiLocker
  type: { type: String, enum: ['certificate', 'pcc'], required: true },
  source: { type: String, enum: ['upload', 'digilocker'], required: true },
  uploaded_at: { type: Date, default: Date.now }
});

const userSkillSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skill_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  category: { type: [String], default: [] }, // Added field for selected categories
  proficiency: { type: String },
  experience_years: { type: Number, default: 0 },
  is_verified: { type: Boolean, default: false },
  pcc_status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  assessment_status: { type: String, enum: ['not_required', 'pending', 'passed', 'failed'], default: 'not_required' },
  certificates: [certificateSchema],
  skill_score: { type: Number, default: 0 },
  progress: { type: Number, default: 0 }, // 0-3 verifications complete
  badges: [String], // e.g., ['Verified Pro']
  feedback_score: { type: Number, default: 0 }, // from job feedback, 0-100
  added_at: { type: Date, default: Date.now }
});
module.exports = mongoose.model('UserSkill', userSkillSchema); 