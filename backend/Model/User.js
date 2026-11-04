const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], required: true }, // [lng, lat]
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone_number: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  address: { type: String }, // Added address field
  pan: { type: String }, // PAN number for financial transactions
  role: {
    type: String,
    enum: ['seeker', 'provider', 'investor', 'admin'],
    required: true
  },
  password: { type: String, required: true },
  location: locationSchema,
  city: { type: String },
  language: {
    type: String,
    enum: ['en', 'hi', 'pa', 'mr', 'ta', 'te', 'ml', 'kn', 'bn', 'gu'],
    default: 'en'
  },
  notification_settings: { type: Object, default: {} },
  skill_set: { type: [String], default: [] },
  income_history: { type: Number },
  credit_score: { type: mongoose.Schema.Types.ObjectId, ref: 'CreditScore' },
  false_accusation_count: { type: Number, default: 0 },
  abuse_true_count: { type: Number, default: 0 },
  monthlySavings: { type: Number, default: 0 },
}, {
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => { delete ret.password; delete ret.__v; return ret; },
  },
});

userSchema.virtual('employer_profile', {
  ref: 'Employer',
  localField: '_id',
  foreignField: 'user_id',
  justOne: true
});

userSchema.virtual('experiences', {
  ref: 'UserExperience',
  localField: '_id',
  foreignField: 'seeker_id',
  justOne: false // A user can have multiple experiences
});

module.exports = mongoose.model('User', userSchema); 