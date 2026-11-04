const mongoose = require('mongoose');

const EmployerSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // One-to-one relationship with User
  },
  company_name: {
    type: String,
    required: true,
    trim: true,
  },
  company_type: {
    type: String,
    enum: ['individual', 'business', 'enterprise', 'startup'],
    required: true,
  },
  gstin_number: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  is_verified: {
    type: Boolean,
    default: false,
  },
  investor_history: {
    type: String, // Storing as TEXT for now, can be JSON later
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Employer', EmployerSchema);