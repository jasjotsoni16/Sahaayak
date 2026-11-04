const mongoose = require('mongoose');

const ToolSchema = new mongoose.Schema({
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  skill_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true,
  },
  condition: {
    type: String,
    enum: ['new', 'good', 'used'],
    required: true,
  },
  availability: {
    type: Boolean,
    default: true,
  },
  price_per_day: {
    type: Number,
    required: true,
  },
  deposit: {
    type: Number,
    required: true,
  },
  location: {
    type: String, // Can be GeoJSON later if Mapbox is integrated
    required: true,
  },
  images: {
    type: [String],
    default: [],
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Tool', ToolSchema);
