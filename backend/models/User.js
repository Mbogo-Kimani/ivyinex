const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  phone: { type: String, required: true, unique: true }, // store E.164 if possible (e.g. 2547...)
  email: { type: String, trim: true },
  passwordHash: { type: String },
  role: { type: String, default: 'user', enum: ['user', 'admin'] }, // user role
  phoneVerified: { type: Boolean, default: false },
  freeTrialUsed: { type: Boolean, default: false }, // free trial by phone
  points: { type: Number, default: 0 }, // user points balance
  referralCode: { type: String, unique: true, sparse: true }, // unique referral code
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who referred this user
  referralPoints: { type: Number, default: 0 }, // points earned from referrals
  createdAt: { type: Date, default: Date.now }
});

// helper to set password
UserSchema.methods.setPassword = async function (plain) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plain, salt);
};

// helper to verify password
UserSchema.methods.comparePassword = async function (plain) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};

// helper to generate referral code
UserSchema.methods.generateReferralCode = function () {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// helper to add points
UserSchema.methods.addPoints = async function (amount, reason = 'manual') {
  this.points += amount;
  await this.save();
  return this.points;
};

// helper to deduct points
UserSchema.methods.deductPoints = async function (amount) {
  if (this.points < amount) {
    throw new Error('Insufficient points');
  }
  this.points -= amount;
  await this.save();
  return this.points;
};

module.exports = mongoose.model('User', UserSchema);
