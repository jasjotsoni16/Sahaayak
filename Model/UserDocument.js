const mongoose = require('mongoose');
const userDocumentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  document_type: { type: String, required: true }, // e.g., aadhaar, pcc, license, certificate
  file_url: { type: [String] }, // Can be an array for multiple files (e.g., Aadhaar front/back)
  document_number: { type: String },
  aadhaar_name: { type: String },
  aadhaar_dob: { type: String },
  aadhaar_gender: { type: String },
  aadhaar_address: { type: String },
  verification_status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  verified_at: { type: Date }
});
module.exports = mongoose.model('UserDocument', userDocumentSchema); 