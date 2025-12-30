const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  level: { type: String, default: 'info' },
  source: { type: String }, // module / route
  message: { type: String },
  metadata: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', LogSchema);
