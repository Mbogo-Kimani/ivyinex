const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    mac: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    name: {
        type: String,
        default: ''
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // MikroTik connection data
    ip: {
        type: String,
        default: null
    },
    chapId: {
        type: String,
        default: null
    },
    chapChallenge: {
        type: String,
        default: null
    },
    linkLogin: {
        type: String,
        default: null
    },
    linkOrig: {
        type: String,
        default: null
    },
    // Timestamps
    registeredAt: {
        type: Date,
        default: Date.now
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    // Free trial tracking
    freeTrialUsed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient lookups
deviceSchema.index({ mac: 1 });
deviceSchema.index({ userId: 1 });
deviceSchema.index({ lastSeen: 1 });

module.exports = mongoose.model('Device', deviceSchema);

















