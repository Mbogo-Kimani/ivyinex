const express = require('express');
const router = express.Router();
const Voucher = require('../models/Voucher');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Device = require('../models/Device');
const { grantAccess } = require('../lib/mikrotik');
const LogModel = require('../models/Log');
const Package = require('../models/PackageModel');

/**
 * POST /api/vouchers/redeem
 * Body: { code, mac, ip, userId (optional) }
 */
router.post('/redeem', async (req, res) => {
  const { code, mac, ip, userId } = req.body;
  const v = await Voucher.findOne({ code });
  if (!v) return res.status(400).json({ error: 'invalid voucher' });
  if (v.usedCount >= v.uses) return res.status(400).json({ error: 'voucher exhausted' });

  // create subscription
  const pkg = await Package.findOne({ key: v.packageKey });
  const now = new Date();
  const endAt = new Date(now.getTime() + (v.durationSeconds * 1000));
  const sub = await Subscription.create({ userId: userId || null, packageKey: v.packageKey, devices: mac ? [{ mac }] : [], startAt: now, endAt, active: true });
  v.usedCount += 1;
  await v.save();

  if (mac) {
    await grantAccess({ mac, ip, comment: `voucher:${v.code}`, until: endAt });
    sub.mikrotikEntry = { type: 'ip-binding', mac, ip, until: endAt };
    await sub.save();
  }

  await LogModel.create({ level: 'info', source: 'vouchers', message: 'voucher-redeemed', metadata: { code, subId: sub._id, mac } });
  res.json({ ok: true, subscription: sub });
});

module.exports = router;
