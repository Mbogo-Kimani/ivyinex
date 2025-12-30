const mongoose = require('mongoose');

const VoucherSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  packageKey: { type: String, required: true },
  valueKES: { type: Number, required: true },
  durationSeconds: { type: Number, required: true },
  uses: { type: Number, default: 1 }, // number of times it can be redeemed
  usedCount: { type: Number, default: 0 },
  soldBy: { type: String }, // seller identifier
  printed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Voucher', VoucherSchema);
