const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skill_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questions: [{
    question_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssessmentQuestion',
      required: true
    },
    selected_option: {
      type: Number, // Index of selected option (0-3)
      default: null
    },
    is_correct: {
      type: Boolean,
      default: null
    }
  }],
  status: {
    type: String,
    enum: ['assigned', 'in_progress', 'completed', 'expired'],
    default: 'assigned'
  },
  start_time: {
    type: Date,
    default: null
  },
  end_time: {
    type: Date,
    default: null
  },
  duration_minutes: {
    type: Number,
    default: 35
  },
  score: {
    type: Number,
    default: null
  },
  percentage: {
    type: Number,
    default: null
  },
  total_questions: {
    type: Number,
    default: 50
  },
  correct_answers: {
    type: Number,
    default: 0
  },
  assigned_at: {
    type: Date,
    default: Date.now
  },
  completed_at: {
    type: Date,
    default: null
  }
});

// Calculate score and percentage when assessment is completed
assessmentSchema.methods.calculateScore = function() {
  const correctAnswers = this.questions.filter(q => q.is_correct === true).length;
  this.correct_answers = correctAnswers;
  this.score = correctAnswers;
  this.percentage = Math.round((correctAnswers / this.total_questions) * 100);
  return this.percentage;
};

module.exports = mongoose.model('Assessment', assessmentSchema);