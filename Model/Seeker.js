const mongoose = require('mongoose');

const seekerSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  is_skill_verified: { type: Boolean, default: false },
  experience: { type: Array, default: [] }, // Array of job history objects
  choice_of_language: { type: String, enum: ['en', 'hi', 'ta', 'te', 'bn'], default: 'en' },
}, { timestamps: true });

module.exports = mongoose.model('Seeker', seekerSchema); 