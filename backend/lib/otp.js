/**
 * OTP helper
 * - generateOTP
 * - sendOtpSms (stub; use Africa's Talking or Twilio)
 *
 * We store OTPs in memory (MVP) or you can store in DB for persistence.
 */

const crypto = require('crypto');
const logger = require('../utils/logger');
const LogModel = require('../models/Log');

// naive in-memory store for OTPs: { phone: { code, expiresAt } }
const otpStore = new Map();

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
}

async function sendOtpSms(phone, code) {
  // TODO: integrate Africa's Talking / Twilio here
  // For MVP we simply log
  logger.info(`Sending OTP ${code} to ${phone} (simulate)`);
  await LogModel.create({ level: 'info', source: 'otp', message: 'otp-sent', metadata: { phone, code } });
  return true;
}

async function createAndSend(phone) {
  const code = generateOTP();
  const expiresAt = Date.now() + 1000 * 60 * 5; // 5 minutes
  otpStore.set(phone, { code, expiresAt });
  await sendOtpSms(phone, code);
  return code;
}

function verify(phone, code) {
  const entry = otpStore.get(phone);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    return false;
  }
  if (entry.code !== code) return false;
  otpStore.delete(phone);
  return true;
}

module.exports = { createAndSend, verify };
