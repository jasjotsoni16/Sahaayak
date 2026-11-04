const mongoose = require('mongoose');

const agreementSchema = new mongoose.Schema({
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  seeker_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  employer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  agreement_content: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending_signing', 'signed_by_employer', 'signed_by_seeker', 'fully_signed', 'voided'],
    default: 'pending_signing',
  },
  docusign_envelope_id: {
    type: String,
  },
  docusign_signing_url_employer: {
    type: String,
  },
  docusign_signing_url_seeker: {
    type: String,
  },
  agreement_pdf_base64: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

agreementSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Agreement', agreementSchema);