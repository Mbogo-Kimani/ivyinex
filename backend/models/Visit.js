const mongoose = require('mongoose');

const VisitSchema = new mongoose.Schema({
    ip: { type: String },
    userAgent: { type: String },
    referrer: { type: String },
    deviceType: { type: String }, // 'mobile', 'tablet', 'desktop'
    path: { type: String },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Visit', VisitSchema);
