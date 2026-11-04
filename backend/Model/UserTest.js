const mongoose = require('mongoose');
const userTestSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skill_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  h5p_link: { type: String },
  score: { type: Number },
  status: { type: String, enum: ['assigned', 'completed', 'reviewed'], default: 'assigned' },
  video_call_id: { type: String },
  taken_on: { type: Date },
  verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
});
module.exports = mongoose.model('UserTest', userTestSchema); 