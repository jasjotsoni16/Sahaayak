const mongoose = require('mongoose');

const assessmentQuestionSchema = new mongoose.Schema({
  skill_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [{
    text: {
      type: String,
      required: true,
      trim: true
    },
    is_correct: {
      type: Boolean,
      default: false
    }
  }],
  difficulty_level: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  category: {
    type: String,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Ensure exactly one correct answer per question
assessmentQuestionSchema.pre('save', function(next) {
  const correctAnswers = this.options.filter(option => option.is_correct);
  if (correctAnswers.length !== 1) {
    return next(new Error('Each question must have exactly one correct answer'));
  }
  if (this.options.length !== 4) {
    return next(new Error('Each question must have exactly 4 options'));
  }
  next();
});

module.exports = mongoose.model('AssessmentQuestion', assessmentQuestionSchema);