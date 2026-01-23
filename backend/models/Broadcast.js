const mongoose = require('mongoose');

const BroadcastSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    target: {
        type: String,
        enum: ['all', 'specific'],
        default: 'all'
    },
    targetValue: { type: String }, // Phone number or user ID if specific
    stats: {
        sent: { type: Number, default: 0 },
        read: { type: Number, default: 0 }
    },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Broadcast', BroadcastSchema);
