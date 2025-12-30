const mongoose = require('mongoose');

/**
 * Points transaction model
 * Tracks all points-related activities: earning, spending, referrals
 */
const PointsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true }, // positive for earning, negative for spending
    type: {
        type: String,
        required: true,
        enum: ['purchase', 'referral', 'bonus', 'redemption', 'admin_adjustment']
    },
    description: { type: String, required: true },
    relatedPackage: { type: String }, // package key if related to package purchase
    relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // for referral points
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Points', PointsSchema);














