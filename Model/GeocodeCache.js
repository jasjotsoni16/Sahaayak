const mongoose = require('mongoose');

// Cache of geocoder answers. Places and pincodes repeat constantly and Nominatim allows
// only ~1 request/second, so we remember results for a while.
const geocodeCacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed },
  expiresAt: { type: Date, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

geocodeCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB deletes expired rows

module.exports = mongoose.model('GeocodeCache', geocodeCacheSchema);
