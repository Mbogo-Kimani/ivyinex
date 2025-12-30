const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amountKES: { type: Number },
  provider: { type: String }, // 'daraja'
  providerPayload: { type: Object }, // raw callback / response
  status: { type: String, enum: ['pending', 'success', 'failed', 'cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', PaymentSchema);
