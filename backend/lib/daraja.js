/**
 * Daraja helper - provides:
 * - getAccessToken()
 * - stkPush(phone, amount, accountRef, callbackUrl, metadata)
 *
 * NOTE: This is a minimal implementation for STK Push on the Daraja sandbox/production.
 * Replace credentials in .env and verify behavior with Safaricom docs.
 */

const axios = require('axios');
const logger = require('../utils/logger');

const consumerKey = process.env.DARAJA_CONSUMER_KEY;
const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;
const shortcode = process.env.DARAJA_SHORTCODE;
const passkey = process.env.DARAJA_PASSKEY;
const callbackUrl = process.env.DARAJA_CALLBACK_URL;
const baseUrl = process.env.DARAJA_BASE_URL || 'https://sandbox.safaricom.co.ke';
const isProduction = process.env.NODE_ENV === 'production' && baseUrl.includes('api.safaricom.co.ke');

/**
 * Normalize phone number to 254XXXXXXXXX format
 */
function normalizePhoneNumber(phone) {
  if (!phone) throw new Error('Phone number is required');

  // Remove any spaces, dashes, or plus signs
  let normalized = phone.replace(/[\s\-+]/g, '');

  // If it starts with 0, replace with 254
  if (normalized.startsWith('0')) {
    normalized = '254' + normalized.substring(1);
  }
  // If it doesn't start with 254, add it
  else if (!normalized.startsWith('254')) {
    normalized = '254' + normalized;
  }

  // Validate length (should be 12 digits: 254 + 9 digits)
  if (normalized.length !== 12 || !/^254\d{9}$/.test(normalized)) {
    throw new Error(`Invalid phone number format: ${phone}. Expected format: 254XXXXXXXXX`);
  }

  return normalized;
}

/**
 * Validate required environment variables
 */
function validateConfig() {
  const missing = [];
  if (!consumerKey) missing.push('DARAJA_CONSUMER_KEY');
  if (!consumerSecret) missing.push('DARAJA_CONSUMER_SECRET');
  if (!shortcode) missing.push('DARAJA_SHORTCODE');
  if (!passkey) missing.push('DARAJA_PASSKEY');
  if (!callbackUrl) missing.push('DARAJA_CALLBACK_URL');

  if (missing.length > 0) {
    throw new Error(`Missing required Daraja environment variables: ${missing.join(', ')}`);
  }
}

async function getAccessToken() {
  try {
    validateConfig();

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const url = `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`;

    logger.info('Fetching Daraja access token', { baseUrl });

    const res = await axios.get(url, {
      headers: { Authorization: `Basic ${auth}` },
      timeout: 10000 // 10 second timeout
    });

    if (!res.data || !res.data.access_token) {
      throw new Error('Invalid response from Daraja: missing access_token');
    }

    logger.info('Daraja token fetched successfully');
    return res.data.access_token;
  } catch (error) {
    if (error.response) {
      // API responded with error status
      const status = error.response.status;
      const data = error.response.data;
      logger.error('Daraja token request failed', {
        status,
        data,
        message: error.message
      });
      throw new Error(`Failed to get Daraja access token: ${status} - ${JSON.stringify(data)}`);
    } else if (error.request) {
      // Request made but no response
      logger.error('Daraja token request timeout/no response', { message: error.message });
      throw new Error('Failed to connect to Daraja API. Check your network connection.');
    } else {
      // Error in request setup
      logger.error('Daraja token request error', { message: error.message, stack: error.stack });
      throw error;
    }
  }
}

function getTimestamp() {
  const d = new Date();
  const YYYY = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const DD = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${YYYY}${MM}${DD}${hh}${mm}${ss}`;
}

async function stkPush({ phone, amount, accountRef = 'Hotspot', transactionDesc = 'Hotspot purchase' }) {
  try {
    validateConfig();

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);

    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const token = await getAccessToken();
    const timestamp = getTimestamp();
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

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
      AccountReference: accountRef,
      TransactionDesc: transactionDesc
    };

    const url = `${baseUrl}/mpesa/stkpush/v1/processrequest`;

    logger.info('Initiating STK push', {
      phone: normalizedPhone,
      amount,
      accountRef,
      baseUrl
    });

    const res = await axios.post(url, body, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30000 // 30 second timeout for STK push
    });

    if (!res.data) {
      throw new Error('Invalid response from Daraja STK push');
    }

    // Check for error in response
    if (res.data.errorCode || res.data.errorMessage) {
      logger.error('STK push error response', {
        errorCode: res.data.errorCode,
        errorMessage: res.data.errorMessage,
        response: res.data
      });
      throw new Error(`STK push failed: ${res.data.errorMessage || res.data.errorCode}`);
    }

    logger.info('STK push initiated successfully', {
      checkoutRequestID: res.data.CheckoutRequestID,
      responseCode: res.data.ResponseCode
    });

    return res.data;
  } catch (error) {
    if (error.response) {
      // API responded with error status
      const status = error.response.status;
      const data = error.response.data;
      logger.error('STK push request failed', {
        status,
        data,
        phone,
        amount,
        message: error.message
      });
      throw new Error(`STK push failed: ${status} - ${JSON.stringify(data)}`);
    } else if (error.request) {
      // Request made but no response
      logger.error('STK push request timeout/no response', {
        phone,
        amount,
        message: error.message
      });
      throw new Error('Failed to connect to Daraja API. Check your network connection.');
    } else {
      // Error in request setup or validation
      logger.error('STK push error', {
        phone,
        amount,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

module.exports = { stkPush, getAccessToken };
