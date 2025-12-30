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

    // create pending payment record
    const payment = await Payment.create({ userId: userId || null, amountKES: pkg.priceKES, provider: 'daraja', status: 'pending' });

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
    const payment = await Payment.findOne({ 'providerPayload.CheckoutRequestID': checkoutRequestID });
    // fallback: if none, find most recent pending payment (MVP)
    if (!payment) {
      const pending = await Payment.findOne({ status: 'pending' }).sort({ createdAt: -1 });
      if (pending) {
        payment = pending;
      }
    }

    if (!payment) {
      await LogModel.create({ level: 'warn', source: 'daraja-callback', message: 'payment-not-found', metadata: { checkoutRequestID } });
      return res.status(200).send('no payment');
    }

    if (resultCode === 0) {
      // success -> create subscription and grant access
      payment.status = 'success';
      payment.providerPayload = stkCallback;
      await payment.save();

      // fetch packageKey from accountRef or payment metadata; fallback to last started package (MVP)
      // In start() we used accountRef: hotspot_<payment._id> so we can map back
      // For a real flow, persist the packageKey in the payment row when initiating
      const accountRef = (stkCallback.CallbackMetadata && stkCallback.CallbackMetadata.Item) ? (stkCallback.CallbackMetadata.Item.find(i => i.Name === 'AccountReference')?.Value) : null;

      // MVP simple: we try to find subscription context in logs (in real: store packageKey on Payment at start)
      // For now we assume package info stored somewhere; for MVP user picks a package then pays quickly

      // Fallback: get packageKey from last checkout logs (not ideal)
      // For demonstration: assume client included packageKey in payment.providerPayload (improve this)
      let packageKey = payment.providerPayload && payment.providerPayload.packageKey;
      if (!packageKey) {
        // as a fallback pick a default simple package (TODO in production)
        packageKey = 'kumi-net';
      }
      const pkg = await require('../models/PackageModel').findOne({ key: packageKey });
      if (!pkg) {
        await LogModel.create({ level: 'error', source: 'daraja-callback', message: 'package-not-found', metadata: { packageKey } });
        return res.status(200).send('package not found');
      }

      // Find mac & ip - in a robust system you'd store these in a pending purchase record. For MVP, we find last checkout start log with paymentId
      // (This is brittle - in production persist pending checkout context in DB)
      const lastLog = await require('../models/Log').findOne({ 'metadata.paymentId': payment._id }).sort({ createdAt: -1 });
      const { mac, ip } = (lastLog && lastLog.metadata) ? { mac: lastLog.metadata.mac, ip: lastLog.metadata.ip } : { mac: null, ip: null };

      // create subscription entry
      const now = new Date();
      const endAt = new Date(now.getTime() + pkg.durationSeconds * 1000);
      const sub = await Subscription.create({ userId: payment.userId || null, packageKey: pkg.key, devices: mac ? [{ mac }] : [], startAt: now, endAt, active: true, paymentId: payment._id });

      await LogModel.create({ level: 'info', source: 'daraja-callback', message: 'subscription-created', metadata: { paymentId: payment._id, subId: sub._id, mac, ip } });

      // grant access immediately if mac present
      if (mac) {
        await grantAccess({ mac, ip, comment: `payment:${payment._id}`, until: endAt });
        sub.mikrotikEntry = { type: 'ip-binding', mac, ip, until: endAt };
        await sub.save();
        await LogModel.create({ level: 'info', source: 'mikrotik', message: 'access-granted', metadata: { subId: sub._id, mac, ip } });
      }

      return res.status(200).send('ok');
    } else {
      payment.status = 'failed';
      payment.providerPayload = stkCallback;
      await payment.save();
      await LogModel.create({ level: 'warn', source: 'daraja-callback', message: 'payment-failed', metadata: { paymentId: payment._id, resultCode, resultDesc } });
      return res.status(200).send('failed');
    }
  } catch (err) {
    logger.error('daraja callback error', { err: err.message });
    await LogModel.create({ level: 'error', source: 'daraja-callback', message: 'callback-error', metadata: { err: err.message } });
    return res.status(500).send('error');
  }
});

module.exports = router;
