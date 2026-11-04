const mongoose = require('mongoose');

const userExperienceSchema = new mongoose.Schema({
  seeker_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  },
  date_joined: {
    type: Date,
    required: true,
  },
  date_left: {
    type: Date,
  },
  job_description: {
    type: String,
  },
  description: {
    type: String,
  },
  location: {
    type: String,
  },
  agreement_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agreement',
  },
});

module.exports = mongoose.model('UserExperience', userExperienceSchema, 'user_experiences');
