const mongoose = require('mongoose');

/**
 * Package model (catalog)
 * Each package has: name, price (KES), durationSeconds, speedKbps, devicesAllowed
 */
const PackageSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g. kumi-net
  name: { type: String, required: true },
  priceKES: { type: Number, required: true },
  durationSeconds: { type: Number, required: true },
  speedKbps: { type: Number, required: true },
  devicesAllowed: { type: Number, default: 1 },
  pointsRequired: { type: Number, default: 0 }, // points needed to purchase this package
  pointsEarned: { type: Number, default: 0 }, // points user gets when purchasing this package
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Package', PackageSchema);
