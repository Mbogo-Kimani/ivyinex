const express = require('express');
const router = express.Router();
const { stkPush } = require('../lib/daraja');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const Package = require('../models/PackageModel');
const User = require('../models/User');
const Device = require('../models/Device');
const { grantAccess, revokeAccessByMac } = require('../lib/mikrotik');
const LogModel = require('../models/Log');
const logger = require('../utils/logger');
const moment = require('moment');
const uuid = require('uuid').v4;

/**
 * Get user-friendly error message from Daraja result code
 */
function getErrorMessage(resultCode, resultDesc) {
  // Map Daraja result codes to user-friendly messages
  const errorMessages = {
    0: 'Payment successful',
    1: 'Insufficient M-Pesa balance. Please top up your account and try again.',
    1032: 'Payment was cancelled. Please try again.',
    1037: 'Payment request timed out. Please ensure your phone is online and try again.',
    1019: 'Transaction expired. Please initiate a new payment.',
    17: 'You cancelled the payment. Please try again.',
    2001: 'Insufficient M-Pesa balance. Please top up your account and try again.',
    // Additional insufficient balance codes
    2002: 'Insufficient M-Pesa balance. Please top up your account and try again.',
    2003: 'Insufficient M-Pesa balance. Please top up your account and try again.'
  };

  // Return user-friendly message if available, otherwise use resultDesc
  if (errorMessages[resultCode]) {
    return errorMessages[resultCode];
  }

  // Fallback to resultDesc if it's meaningful, otherwise generic message
  if (resultDesc && resultDesc !== 'OK' && resultDesc !== 'The service request is processed successfully.') {
    return resultDesc;
  }

  return 'Payment failed. Please try again.';
}

/**
 * POST /api/checkout/start
 * Body: { phone, packageKey, mac (from captive portal), ip (optional), userId (optional) }
 * Response: returns Daraja STK push response (CheckoutRequestID etc)
 */
router.post('/start', async (req, res) => {
  try {
    const { phone, packageKey, mac, ip, userId } = req.body;

    // Validate required fields
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    if (!packageKey) {
      return res.status(400).json({ error: 'Package key is required' });
    }

    const pkg = await Package.findOne({ key: packageKey });
    if (!pkg) {
      return res.status(400).json({ error: 'Invalid package key' });
    }

    if (!pkg.priceKES || pkg.priceKES <= 0) {
      return res.status(400).json({ error: 'Package has invalid price' });
    }

    // create pending payment record with all context needed for callback
    const payment = await Payment.create({
      userId: userId || null,
      amountKES: pkg.priceKES,
      provider: 'daraja',
      status: 'pending',
      packageKey: packageKey, // Store package key for callback
      phone: phone, // Store phone for validation
      mac: mac || null, // Store MAC for device binding
      ip: ip || null // Store IP for device binding
    });

    // store a lightweight pending object so callback knows context (in production use DB or cache)
    const pendingToken = uuid();
    await LogModel.create({ level: 'info', source: 'checkout', message: 'checkout-started', metadata: { paymentId: payment._id, phone, packageKey, mac, ip, pendingToken } });

    // TODO: store pending context in DB (we use payment._id for now)
    // call STK push
    try {
      const stk = await stkPush({ phone, amount: pkg.priceKES, accountRef: 'WiFi-Pay' });
      // keep provider payload
      payment.providerPayload = stk;
      await payment.save();
      res.json({ ok: true, data: stk, paymentId: payment._id });
    } catch (err) {
      logger.error('STK Push failed', {
        err: err.message,
        stack: err.stack,
        phone,
        packageKey,
        paymentId: payment._id
      });
      await LogModel.create({
        level: 'error',
        source: 'checkout',
        message: 'stk-failed',
        metadata: {
          err: err.message,
          stack: err.stack,
          phone,
          packageKey,
          paymentId: payment._id
        }
      });

      // Update payment status to failed
      payment.status = 'failed';
      payment.providerPayload = {
        error: err.message,
        failedAt: new Date()
      };
      await payment.save();

      // Check if it's a merchant configuration error
      const isMerchantError = err.message.includes('Merchant') ||
        err.message.includes('shortcode') ||
        err.message.includes('passkey') ||
        err.message.includes('500.001.1001');

      // Return user-friendly error message
      // For merchant errors, provide helpful guidance
      let userMessage = err.message;
      if (isMerchantError) {
        userMessage = 'Payment service configuration error. Please contact support or try again later.';
      }

      res.status(500).json({
        error: 'STK push failed',
        message: userMessage,
        paymentId: payment._id,
        // Include detailed error for admin/debugging (can be removed in production)
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  } catch (err) {
    // Catch any errors outside the STK push (e.g., database errors)
    logger.error('Checkout start error', {
      err: err.message,
      stack: err.stack,
      body: req.body
    });
    await LogModel.create({
      level: 'error',
      source: 'checkout',
      message: 'checkout-start-error',
      metadata: {
        err: err.message,
        stack: err.stack,
        body: req.body
      }
    });
    res.status(500).json({
      error: 'Checkout failed',
      message: err.message
    });
  }
});

/**
 * Helper: Safely extract item from CallbackMetadata
 */
function getCallbackItem(items, name) {
  if (!Array.isArray(items)) return null;
  const found = items.find(i => i?.Name === name);
  return found?.Value ?? null;
}

/**
 * Helper: Normalize phone number safely
 */
function normalizePhone(phone) {
  if (!phone) return null;
  const str = String(phone);
  // If starts with 254, replace with 0. If starts with +254, handle that too.
  // The user requirement said: 2547XXXXXXXX -> 07XXXXXXXX
  return str.startsWith('254') ? '0' + str.slice(3) : str;
}

/**
 * POST /api/checkout/daraja-callback
 * Daraja will POST the result here. We verify and then create subscription & grant access.
 * NOTE: You must configure DARAJA_CALLBACK_URL in env and secure this endpoint in production.
 */
router.post('/daraja-callback', async (req, res) => {
  try {
    // 1. Raw Logging (First thing)
    // We log the raw body to ensure we have a record even if parsing fails later
    const rawBody = req.body;
    logger.info('Daraja callback received - RAW', {
      bodySnippet: JSON.stringify(rawBody).substring(0, 1000) // Log first 1000 chars safety
    });

    // 2. Defensive Parsing
    // Extract Body safely
    const body = rawBody?.Body || rawBody;
    const stkCallback = body?.stkCallback || body;

    // Extract Critical Fields safely
    const merchantRequestID = stkCallback?.MerchantRequestID || null;
    const checkoutRequestID = stkCallback?.CheckoutRequestID || stkCallback?.checkoutRequestID || null;

    // ResultCode: Handle string/number and missing/undefined
    let resultCode = stkCallback?.ResultCode;
    if (resultCode === undefined) resultCode = stkCallback?.resultCode; // fallback

    // Convert to Number safely. If null/undefined/NaN, default to non-zero (failure) to be safe.
    const numericResultCode = resultCode !== undefined && resultCode !== null ? Number(resultCode) : -1;

    const resultDesc = String(stkCallback?.ResultDesc || stkCallback?.resultDesc || 'Unknown Result');

    // 3. Log Parsed Data
    logger.info('Daraja callback parsed', {
      merchantRequestID,
      checkoutRequestID,
      numericResultCode,
      resultDesc
    });

    // 4. Validate Critical Data
    if (!checkoutRequestID) {
      logger.error('Missing CheckoutRequestID in callback', { body: rawBody });
      // Return 200 to stop Daraja retries
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // 5. Find Payment Session
    // We use the CheckoutRequestID to find the pending payment
    const payment = await Payment.findOne({
      'providerPayload.CheckoutRequestID': checkoutRequestID
    });

    if (!payment) {
      // Log critical error but return 200
      logger.error('Payment session not found for callback', { checkoutRequestID });
      await LogModel.create({
        level: 'error',
        source: 'daraja-callback',
        message: 'session-not-found',
        metadata: { checkoutRequestID, numericResultCode, resultDesc }
      });
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // 6. Idempotency Check
    if (payment.status === 'success') {
      logger.info('Payment already completed successfully. Ignoring duplicate/late callback.', {
        paymentId: payment._id,
        checkoutRequestID
      });
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // 7. Update Payment Record with Callback Data
    // We persist the raw results regardless of success/failure
    payment.providerPayload = {
      ...payment.providerPayload,
      ...stkCallback, // store full callback details
      callbackProcessedAt: new Date()
    };

    // 8. Result Logic
    if (numericResultCode === 0) {
      // === SUCCESS CASE ===

      // Safe Metadata Extraction
      const items = stkCallback?.CallbackMetadata?.Item;
      const amount = getCallbackItem(items, 'Amount');
      const mpesaReceiptNumber = getCallbackItem(items, 'MpesaReceiptNumber');
      const transactionDate = getCallbackItem(items, 'TransactionDate');
      const phoneNumber = getCallbackItem(items, 'PhoneNumber');

      // Update Payload with extracted clean values
      payment.providerPayload.mpesaReceiptNumber = mpesaReceiptNumber;
      payment.providerPayload.transactionDate = transactionDate;
      payment.providerPayload.payerPhone = phoneNumber;

      // Validate Amount (Optional warning, don't fail)
      if (amount && payment.amountKES && Math.abs(Number(amount) - payment.amountKES) > 1) {
        logger.warn('Payment amount mismatch', {
          expected: payment.amountKES,
          received: amount,
          paymentId: payment._id
        });
      }

      // === PROVISIONING ===

      // A. Grant Subscription
      const pkg = await Package.findOne({ key: payment.packageKey });
      if (!pkg) {
        logger.error('Package not found during provisioning', { packageKey: payment.packageKey });
        // We still mark payment as success because we took user's money!
        // We just flag it for manual intervention
        payment.status = 'success_no_package';
      } else {
        // Create Subscription
        const now = new Date();
        const endAt = new Date(now.getTime() + pkg.durationSeconds * 1000);

        const sub = await Subscription.create({
          userId: payment.userId || null,
          packageKey: pkg.key,
          packageName: pkg.name,
          devices: payment.mac ? [{ mac: payment.mac }] : [],
          startAt: now,
          endAt,
          active: true,
          status: 'active',
          priceKES: pkg.priceKES,
          speedKbps: pkg.speedKbps,
          durationSeconds: pkg.durationSeconds,
          paymentId: payment._id,
          paymentMethod: 'daraja'
        });

        // B. Grant MikroTik Access (if MAC present)
        if (payment.mac) {
          try {
            await grantAccess({
              mac: payment.mac,
              ip: payment.ip,
              comment: `payment:${payment._id}`,
              until: endAt
            });
            // Update sub with binding info
            sub.mikrotikEntry = {
              type: 'ip-binding',
              mac: payment.mac,
              ip: payment.ip,
              until: endAt,
              grantedAt: new Date()
            };
            await sub.save();
          } catch (mikrotikErr) {
            logger.error('Failed to grant MikroTik access', { err: mikrotikErr.message });
            // Don't fail the request, just log. Subscription is active.
          }
        }
      }

      // Mark Payment as Success
      payment.status = 'success';
      await payment.save();

      // Log Success
      logger.info('Payment processed successfully', {
        paymentId: payment._id,
        receipt: mpesaReceiptNumber,
        amount: amount
      });

    } else {
      // === FAILURE CASE ===
      // ResultCode !== 0
      payment.status = 'failed';
      const userMsg = getErrorMessage(numericResultCode, resultDesc);

      // Store error details
      payment.providerPayload.errorCode = numericResultCode;
      payment.providerPayload.errorMessage = userMsg;

      await payment.save();

      logger.warn('Payment failed via callback', {
        paymentId: payment._id,
        code: numericResultCode,
        desc: resultDesc
      });
    }

    // 9. Always Return 200 OK
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

  } catch (err) {
    // 10. Global Error Handler
    // Catch ANY crash in the logic above
    logger.error('Daraja callback fatal error', { err: err.message, stack: err.stack });

    // Still return 200 to Daraja to prevent retry loops of a broken handler
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
});

/**
 * GET /api/checkout/test-callback
 * Test endpoint to verify callback URL is accessible
 */
router.get('/test-callback', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Callback endpoint is accessible',
    timestamp: new Date().toISOString(),
    path: '/api/checkout/daraja-callback'
  });
});

/**
 * POST /api/checkout/test-callback
 * Test endpoint to simulate callback for debugging
 */
router.post('/test-callback', async (req, res) => {
  try {
    const { paymentId, resultCode = 1, resultDesc = 'Insufficient balance' } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'paymentId required' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Simulate callback processing
    const errorMessage = getErrorMessage(resultCode, resultDesc);
    payment.status = 'failed';
    payment.providerPayload = {
      ...payment.providerPayload,
      ResultCode: resultCode,
      ResultDesc: resultDesc,
      errorMessage: errorMessage,
      errorCode: resultCode,
      failedAt: new Date(),
      testCallback: true
    };
    await payment.save();

    logger.info('Test callback processed', { paymentId, resultCode, errorMessage });

    res.json({
      status: 'ok',
      message: 'Test callback processed',
      paymentId: payment._id,
      paymentStatus: payment.status,
      errorMessage
    });
  } catch (err) {
    logger.error('Test callback error', { err: err.message });
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/checkout/pending-payments
 * Get list of pending payments (for debugging)
 */
router.get('/pending-payments', async (req, res) => {
  try {
    const pendingPayments = await Payment.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id amountKES packageKey phone createdAt providerPayload');

    res.json({
      count: pendingPayments.length,
      payments: pendingPayments.map(p => ({
        paymentId: p._id,
        amountKES: p.amountKES,
        packageKey: p.packageKey,
        phone: p.phone,
        createdAt: p.createdAt,
        checkoutRequestID: p.providerPayload?.CheckoutRequestID || null,
        ageMinutes: Math.round((Date.now() - p.createdAt) / 60000)
      }))
    });
  } catch (err) {
    logger.error('Failed to get pending payments', { err: err.message });
    res.status(500).json({ error: 'Failed to get pending payments' });
  }
});

/**
 * GET /api/checkout/status/:paymentId
 * Check payment status - allows frontend to poll for payment completion
 */
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Prevent caching of status checks
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    // Validate paymentId format
    if (!paymentId || paymentId.length < 10) {
      return res.status(400).json({ error: 'Invalid payment ID' });
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Get user-friendly error message if payment failed
    let errorMessage = null;
    let errorCode = null;
    if (payment.status === 'failed' && payment.providerPayload) {
      errorCode = payment.providerPayload.ResultCode || payment.providerPayload.errorCode;
      // Check if errorMessage is already stored (from callback)
      if (payment.providerPayload.errorMessage) {
        errorMessage = payment.providerPayload.errorMessage;
      } else if (errorCode) {
        // Generate error message from result code
        errorMessage = getErrorMessage(errorCode, payment.providerPayload.ResultDesc);
      } else if (payment.providerPayload.ResultDesc) {
        // Use ResultDesc if available
        errorMessage = payment.providerPayload.ResultDesc;
      } else {
        errorMessage = 'Payment failed. Please try again.';
      }

      logger.info('Payment status check - failed payment', {
        paymentId: payment._id,
        errorCode,
        errorMessage,
        hasProviderPayload: !!payment.providerPayload,
        providerPayloadKeys: payment.providerPayload ? Object.keys(payment.providerPayload) : []
      });
    }

    // Check if subscription was created for this payment
    let subscription = null;
    if (payment.status === 'success') {
      subscription = await Subscription.findOne({ paymentId: payment._id });
    }

    res.json({
      status: payment.status,
      amountKES: payment.amountKES,
      packageKey: payment.packageKey,
      phone: payment.phone,
      errorMessage: errorMessage,
      errorCode: errorCode,
      subscriptionId: subscription?._id || null,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt || payment.createdAt
    });
  } catch (err) {
    logger.error('Payment status check error', {
      err: err.message,
      stack: err.stack,
      paymentId: req.params.paymentId
    });
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

module.exports = router;
