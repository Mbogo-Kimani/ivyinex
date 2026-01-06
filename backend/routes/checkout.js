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
    2001: 'Insufficient M-Pesa balance. Please top up your account and try again.'
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
      const stk = await stkPush({ phone, amount: pkg.priceKES, accountRef: `hotspot_${payment._id}` });
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
      payment.providerPayload = { error: err.message };
      await payment.save();

      // Return detailed error message for debugging (in production, you might want to hide some details)
      res.status(500).json({
        error: 'STK push failed',
        message: err.message,
        paymentId: payment._id
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
 * POST /api/checkout/daraja-callback
 * Daraja will POST the result here. We verify and then create subscription & grant access.
 * NOTE: You must configure DARAJA_CALLBACK_URL in env and secure this endpoint in production.
 */
router.post('/daraja-callback', async (req, res) => {
  // Daraja callback raw body: req.body
  const cb = req.body;
  await LogModel.create({ level: 'info', source: 'daraja-callback', message: 'callback-received', metadata: cb });
  // Real implementation must validate and extract CheckoutRequestID and ResultCode/ResultDesc
  try {
    // For MVP we expect the body contains checkoutRequestID and ResultCode
    const body = cb.Body || cb;
    const stkCallback = body.stkCallback || body;
    // adapt to actual payload structure
    const checkoutRequestID = stkCallback.CheckoutRequestID || (stkCallback.checkoutRequestID);
    const resultCode = stkCallback.ResultCode !== undefined ? stkCallback.ResultCode : (stkCallback.resultCode || 0);
    const resultDesc = stkCallback.ResultDesc || stkCallback.resultDesc || 'OK';

    // Find payment by matching checkout id in providerPayload
    // CRITICAL: Only match by CheckoutRequestID, no fallback to prevent wrong payment matching
    const payment = await Payment.findOne({ 'providerPayload.CheckoutRequestID': checkoutRequestID });

    if (!payment) {
      await LogModel.create({
        level: 'warn',
        source: 'daraja-callback',
        message: 'payment-not-found',
        metadata: { checkoutRequestID, resultCode, resultDesc }
      });
      logger.warn('Payment not found for callback', { checkoutRequestID });
      return res.status(200).send('payment not found');
    }

    if (resultCode === 0) {
      // Payment successful - validate and process

      // Extract callback data for validation
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
      const callbackAmount = callbackMetadata.find(i => i.Name === 'Amount')?.Value;
      const callbackPhone = callbackMetadata.find(i => i.Name === 'PhoneNumber')?.Value;
      const mpesaReceiptNumber = callbackMetadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value;

      // Validate amount matches payment record
      if (callbackAmount && Math.round(callbackAmount) !== Math.round(payment.amountKES)) {
        await LogModel.create({
          level: 'error',
          source: 'daraja-callback',
          message: 'amount-mismatch',
          metadata: {
            paymentId: payment._id,
            expectedAmount: payment.amountKES,
            receivedAmount: callbackAmount
          }
        });
        logger.error('Payment amount mismatch', {
          paymentId: payment._id,
          expected: payment.amountKES,
          received: callbackAmount
        });
        // Still mark as success but log the issue
      }

      // Validate phone number matches (normalize for comparison)
      if (callbackPhone && payment.phone) {
        const normalizedCallbackPhone = callbackPhone.replace(/[\s\-+]/g, '');
        const normalizedPaymentPhone = payment.phone.replace(/[\s\-+]/g, '');
        if (normalizedCallbackPhone !== normalizedPaymentPhone && !normalizedCallbackPhone.endsWith(normalizedPaymentPhone.slice(-9))) {
          await LogModel.create({
            level: 'warn',
            source: 'daraja-callback',
            message: 'phone-mismatch',
            metadata: {
              paymentId: payment._id,
              expectedPhone: payment.phone,
              receivedPhone: callbackPhone
            }
          });
          logger.warn('Payment phone mismatch', {
            paymentId: payment._id,
            expected: payment.phone,
            received: callbackPhone
          });
        }
      }

      // Use stored packageKey from payment record
      const packageKey = payment.packageKey;
      if (!packageKey) {
        await LogModel.create({
          level: 'error',
          source: 'daraja-callback',
          message: 'packageKey-missing',
          metadata: { paymentId: payment._id }
        });
        logger.error('Package key missing in payment record', { paymentId: payment._id });
        payment.status = 'failed';
        payment.providerPayload = { ...stkCallback, error: 'Package key missing' };
        await payment.save();
        return res.status(200).send('package key missing');
      }

      const pkg = await Package.findOne({ key: packageKey });
      if (!pkg) {
        await LogModel.create({
          level: 'error',
          source: 'daraja-callback',
          message: 'package-not-found',
          metadata: { packageKey, paymentId: payment._id }
        });
        logger.error('Package not found', { packageKey, paymentId: payment._id });
        payment.status = 'failed';
        payment.providerPayload = { ...stkCallback, error: 'Package not found' };
        await payment.save();
        return res.status(200).send('package not found');
      }

      // Use stored mac & ip from payment record
      const mac = payment.mac;
      const ip = payment.ip;

      // Create subscription entry with error handling
      // Note: We'll update payment status to 'success' only after subscription is created
      let sub = null;
      try {
        const now = new Date();
        const endAt = new Date(now.getTime() + pkg.durationSeconds * 1000);
        sub = await Subscription.create({
          userId: payment.userId || null,
          packageKey: pkg.key,
          packageName: pkg.name,
          devices: mac ? [{ mac }] : [],
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

        await LogModel.create({
          level: 'info',
          source: 'daraja-callback',
          message: 'subscription-created',
          metadata: {
            paymentId: payment._id,
            subId: sub._id,
            mac,
            ip,
            packageKey: pkg.key
          }
        });
        logger.info('Subscription created successfully', {
          paymentId: payment._id,
          subId: sub._id,
          packageKey: pkg.key
        });

        // Update payment status to success only after subscription is created
        payment.status = 'success';
        payment.providerPayload = {
          ...stkCallback,
          mpesaReceiptNumber: mpesaReceiptNumber,
          processedAt: new Date()
        };
        await payment.save();
      } catch (subError) {
        logger.error('Failed to create subscription', {
          err: subError.message,
          stack: subError.stack,
          paymentId: payment._id
        });
        await LogModel.create({
          level: 'error',
          source: 'daraja-callback',
          message: 'subscription-creation-failed',
          metadata: {
            err: subError.message,
            paymentId: payment._id
          }
        });
        // Payment is already marked as success, but subscription failed
        // In production, you might want to implement a retry mechanism or manual review
        return res.status(200).send('subscription creation failed');
      }

      // Grant MikroTik access if MAC is present
      if (mac && sub) {
        try {
          const now = new Date();
          const endAt = new Date(now.getTime() + pkg.durationSeconds * 1000);
          await grantAccess({
            mac,
            ip,
            comment: `payment:${payment._id}`,
            until: endAt
          });
          sub.mikrotikEntry = {
            type: 'ip-binding',
            mac,
            ip,
            until: endAt,
            grantedAt: new Date()
          };
          await sub.save();
          await LogModel.create({
            level: 'info',
            source: 'mikrotik',
            message: 'access-granted',
            metadata: { subId: sub._id, mac, ip, paymentId: payment._id }
          });
          logger.info('MikroTik access granted', {
            subId: sub._id,
            mac,
            ip,
            paymentId: payment._id
          });
        } catch (mikrotikError) {
          // Log error but don't fail the entire process
          // Subscription is created, access can be granted manually if needed
          logger.error('Failed to grant MikroTik access', {
            err: mikrotikError.message,
            stack: mikrotikError.stack,
            subId: sub._id,
            mac,
            ip
          });
          await LogModel.create({
            level: 'error',
            source: 'mikrotik',
            message: 'access-grant-failed',
            metadata: {
              err: mikrotikError.message,
              subId: sub._id,
              mac,
              ip,
              paymentId: payment._id
            }
          });
          // Continue - subscription is created, access issue can be resolved manually
        }
      }

      return res.status(200).send('ok');
    } else {
      // Payment failed - get user-friendly error message
      const errorMessage = getErrorMessage(resultCode, resultDesc);
      
      // Payment failed - update status and log
      payment.status = 'failed';
      payment.providerPayload = {
        ...stkCallback,
        failedAt: new Date(),
        errorMessage: errorMessage, // Store user-friendly error message
        errorCode: resultCode
      };
      await payment.save();
      await LogModel.create({
        level: 'warn',
        source: 'daraja-callback',
        message: 'payment-failed',
        metadata: {
          paymentId: payment._id,
          resultCode,
          resultDesc,
          errorMessage,
          packageKey: payment.packageKey
        }
      });
      logger.warn('Payment failed', {
        paymentId: payment._id,
        resultCode,
        resultDesc,
        errorMessage,
        packageKey: payment.packageKey
      });
      return res.status(200).send('failed');
    }
  } catch (err) {
    logger.error('Daraja callback error', {
      err: err.message,
      stack: err.stack,
      body: req.body
    });
    await LogModel.create({
      level: 'error',
      source: 'daraja-callback',
      message: 'callback-error',
      metadata: {
        err: err.message,
        stack: err.stack,
        body: req.body
      }
    });
    // Always return 200 to Daraja to acknowledge receipt
    // Even if we have errors, we don't want Daraja to retry
    return res.status(200).send('error');
  }
});

/**
 * GET /api/checkout/status/:paymentId
 * Check payment status - allows frontend to poll for payment completion
 */
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
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
      errorMessage = payment.providerPayload.errorMessage || 
                    getErrorMessage(errorCode, payment.providerPayload.ResultDesc);
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
