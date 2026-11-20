const mongoose = require('mongoose');

// Connects once and reuses the connection. On Vercel each warm function instance keeps it between
// requests, so only a cold start pays for connecting. Throws on failure; the caller decides what to do.
let connecting = null;

const connectDB = () => {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connecting) {
    if (!process.env.MONGODB_URI) return Promise.reject(new Error('MONGODB_URI is not set'));
    connecting = mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
      .then(() => console.log('MongoDB connected'))
      .catch((err) => { connecting = null; throw err; });
  }
  return connecting;
};

module.exports = connectDB;
