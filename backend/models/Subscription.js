const mongoose = require('mongoose');

/**
 * Subscription: represents a purchase/active entitlement
 * Static mode: subscription persists; when user reconnects we re-grant access
 */
const SubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' }, // Link to device
  packageKey: { type: String, required: true },
  packageName: { type: String }, // Store package name for display
  devices: [{ mac: String }], // assigned device MACs
  startAt: { type: Date, default: Date.now },
  endAt: { type: Date, required: true },
  status: { type: String, default: 'active', enum: ['active', 'expired', 'cancelled'] },
  active: { type: Boolean, default: true },
  priceKES: { type: Number, default: 0 }, // Store price for display
  speedKbps: { type: Number, default: 1000 }, // Store speed for display
  durationSeconds: { type: Number }, // Store duration for display
  paymentMethod: { type: String, default: 'unknown' }, // How was this paid for
  mikrotikEntry: { type: Object }, // data about binding/user created on router
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);
