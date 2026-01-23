const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    type: {
        type: String,
        enum: ['system', 'referral', 'reward', 'admin', 'welcome'],
        default: 'system'
    },
    isRead: { type: Boolean, default: false, index: true },
    metadata: { type: Object }, // For storing extra data like referralId, points, etc.
    broadcastId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broadcast' }, // Optional link to broadcast
    createdAt: { type: Date, default: Date.now, index: true }
});

// Index for fetching inbox (most recent first)
MessageSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);
