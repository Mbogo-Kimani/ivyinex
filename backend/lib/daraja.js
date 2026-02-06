/**
 * Daraja helper
 * - getAccessToken()
 * - stkPush({ phone, amount, accountRef, transactionDesc })
 */

const axios = require('axios');
const logger = require('../utils/logger');

/* =========================
   ENV CONFIG
========================= */
const consumerKey = process.env.DARAJA_CONSUMER_KEY;
const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;
const shortcode = process.env.DARAJA_SHORTCODE;
const passkey = process.env.DARAJA_PASSKEY;
const callbackUrl = process.env.DARAJA_CALLBACK_URL;

const baseUrl =
  process.env.NODE_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

/* =========================
   HELPERS
========================= */

/**
 * Normalize phone number to 254XXXXXXXXX
 */
function normalizePhoneNumber(phone) {
  if (!phone) throw new Error('Phone number is required');

  let normalized = phone.replace(/[\s\-+]/g, '');

  if (normalized.startsWith('0')) {
    normalized = '254' + normalized.substring(1);
  } else if (!normalized.startsWith('254')) {
    normalized = '254' + normalized;
  }

  if (!/^254\d{9}$/.test(normalized)) {
    throw new Error(`Invalid phone number format: ${phone}`);
  }

  return normalized;
}

/**
 * Validate env vars
 */
function validateConfig() {
  const missing = [];

  if (!consumerKey) missing.push('DARAJA_CONSUMER_KEY');
  if (!consumerSecret) missing.push('DARAJA_CONSUMER_SECRET');
  if (!shortcode) missing.push('DARAJA_SHORTCODE');
  if (!passkey) missing.push('DARAJA_PASSKEY');
  if (!callbackUrl) missing.push('DARAJA_CALLBACK_URL');

  if (missing.length) {
    throw new Error(`Missing Daraja env vars: ${missing.join(', ')}`);
  }

  logger.info('Daraja configuration loaded', {
    baseUrl,
    shortcode: `${shortcode.substring(0, 3)}***`,
    callbackUrl: 'SET',
    hasConsumerKey: !!consumerKey,
    hasConsumerSecret: !!consumerSecret,
    hasPasskey: !!passkey
  });
}

/**
 * Generate timestamp (YYYYMMDDHHMMSS)
 */
function getTimestamp() {
  const d = new Date();
  return (
    d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0') +
    String(d.getHours()).padStart(2, '0') +
    String(d.getMinutes()).padStart(2, '0') +
    String(d.getSeconds()).padStart(2, '0')
  );
}

/* =========================
   OAUTH TOKEN
========================= */
async function getAccessToken() {
  validateConfig();

  const auth = Buffer.from(
    `${consumerKey}:${consumerSecret}`
  ).toString('base64');

  const url = `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`;

  try {
    logger.info('Fetching Daraja access token', { baseUrl });

    const res = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`
      },
      timeout: 10000
    });

    if (!res.data?.access_token) {
      throw new Error('No access_token returned');
    }

    logger.info('Daraja token fetched successfully');
    return res.data.access_token;
  } catch (error) {
    if (error.response) {
      logger.error('Daraja token request failed', {
        status: error.response.status,
        data: error.response.data
      });
    }
    throw new Error('Failed to get Daraja access token');
  }
}

/* =========================
   STK PUSH
========================= */
async function stkPush({
  phone,
  amount,
  accountRef = 'Hotspot',
  transactionDesc = 'Hotspot purchase'
}) {
  validateConfig();

  const normalizedPhone = normalizePhoneNumber(phone);

  if (!amount || amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  const token = await getAccessToken();
  const timestamp = getTimestamp();
  const password = Buffer.from(
    `${shortcode}${passkey}${timestamp}`
  ).toString('base64');

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount),
    PartyA: normalizedPhone,
    PartyB: shortcode,
    PhoneNumber: normalizedPhone,
    CallBackURL: callbackUrl,
    // Safaricom Limits: AccountReference (12 chars), TransactionDesc (13 chars)
    AccountReference: accountRef.substring(0, 12),
    TransactionDesc: transactionDesc.substring(0, 13)
  };

  const url = `${baseUrl}/mpesa/stkpush/v1/processrequest`;

  try {
    logger.info('Initiating STK push', {
      phone: normalizedPhone,
      amount,
      accountRef,
      callbackUrl // Log the callback URL being sent
    });

    const res = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (!res.data) {
      throw new Error('Empty response from Daraja');
    }

    if (res.data.errorCode) {
      throw new Error(
        `STK push failed: ${res.data.errorMessage} (${res.data.errorCode})`
      );
    }

    logger.info('STK push initiated successfully', {
      CheckoutRequestID: res.data.CheckoutRequestID
    });

    return res.data;
  } catch (error) {
    if (error.response) {
      logger.error('STK push request failed', {
        status: error.response.status,
        data: error.response.data
      });
    }
    throw error;
  }
}

module.exports = {
  stkPush,
  getAccessToken
};
