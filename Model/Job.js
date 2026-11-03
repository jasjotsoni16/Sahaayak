const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  employer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  responsibilities: {
    type: String,
  },
  skills_required: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
    },
  ],
  experience_required: {
    type: Number,
    default: 0,
  },
  assessment_required: {
    type: Boolean,
    default: false,
  },
  number_of_openings: {
    type: Number,
    required: true,
    min: 1,
  },
  job_type: {
    type: String,
    enum: ['full_time', 'part_time', 'gig', 'contract'],
    required: true,
  },
  duration: {
    type: String,
  },
  wage_type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'per_task'],
    required: true,
  },
  salary_min: {
    type: Number,
    required: true,
    min: 0,
  },
  salary_max: {
    type: Number,
    required: true,
    min: 0,
  },
  negotiable: {
    type: Boolean,
    default: false,
  },
  leaves_allowed: {
    type: Number,
  },
  openings_hired: {
    type: Number,
    default: 0,
  },
  is_archived: {
    type: Boolean,
    default: false,
  },
  city: {
        type: String,
        required: true,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            required: true,
        },
    },
  }, { timestamps: true });

jobSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Job', jobSchema, 'job');