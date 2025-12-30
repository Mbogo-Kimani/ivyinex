const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const LogModel = require('../models/Log');
const logger = require('../utils/logger');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'no token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

// Add a device (store mac)
router.post('/add', authMiddleware, async (req, res) => {
  const { mac, name } = req.body;
  if (!mac) return res.status(400).json({ error: 'mac required' });
  const normalized = mac.toUpperCase();
  let device = await Device.findOne({ mac: normalized });
  if (device) {
    // attach to user if not already
    if (!device.userId) {
      device.userId = req.userId;
      await device.save();
    }
    return res.json({ ok: true, device });
  }
  device = await Device.create({ mac: normalized, name, userId: req.userId });
  await LogModel.create({ level: 'info', source: 'devices', message: 'device-added', metadata: { mac: normalized, userId: req.userId } });
  res.json({ ok: true, device });
});

// Remove device (detach)
router.post('/remove', authMiddleware, async (req, res) => {
  const { mac } = req.body;
  if (!mac) return res.status(400).json({ error: 'mac required' });
  const normalized = mac.toUpperCase();
  const device = await Device.findOne({ mac: normalized });
  if (!device) return res.status(404).json({ error: 'device not found' });
  if (device.userId?.toString() !== req.userId) return res.status(403).json({ error: 'not allowed' });
  // detach rather than delete to preserve freeTrialUsed audit
  device.userId = null;
  await device.save();
  await LogModel.create({ level: 'info', source: 'devices', message: 'device-removed', metadata: { mac: normalized, userId: req.userId } });
  res.json({ ok: true });
});

/**
 * POST /api/devices/register
 * Auto-register device when user connects through MikroTik
 * Body: { mac, ip, chapId, chapChallenge, linkLogin, linkOrig }
 */
router.post('/register', async (req, res) => {
  const { mac, ip, chapId, chapChallenge, linkLogin, linkOrig } = req.body;

  if (!mac) {
    return res.status(400).json({ error: 'MAC address required' });
  }

  try {
    // Check if device already exists
    let device = await Device.findOne({ mac });

    if (!device) {
      // Create new device record
      device = new Device({
        mac,
        ip,
        chapId,
        chapChallenge,
        linkLogin,
        linkOrig,
        registeredAt: new Date(),
        lastSeen: new Date()
      });
      await device.save();

      await LogModel.create({
        level: 'info',
        source: 'device-registration',
        message: 'device-auto-registered',
        metadata: { mac, ip, deviceId: device._id }
      });

      logger.info('Device auto-registered', { mac, ip, deviceId: device._id });
    } else {
      // Update existing device with new connection data
      device.ip = ip;
      device.chapId = chapId;
      device.chapChallenge = chapChallenge;
      device.linkLogin = linkLogin;
      device.linkOrig = linkOrig;
      device.lastSeen = new Date();
      await device.save();

      await LogModel.create({
        level: 'info',
        source: 'device-registration',
        message: 'device-updated',
        metadata: { mac, ip, deviceId: device._id }
      });
    }

    res.json({
      ok: true,
      device: {
        id: device._id,
        mac: device.mac,
        ip: device.ip,
        hasUser: !!device.userId
      }
    });

  } catch (err) {
    logger.error('Device registration failed', { err: err.message, mac, ip });
    await LogModel.create({
      level: 'error',
      source: 'device-registration',
      message: 'registration-failed',
      metadata: { err: err.message, mac, ip }
    });
    res.status(500).json({ error: 'Device registration failed' });
  }
});

/**
 * POST /api/devices/link-user
 * Link an existing device to a user account (when user registers later)
 * Body: { mac, userId }
 */
router.post('/link-user', async (req, res) => {
  const { mac, userId } = req.body;

  if (!mac || !userId) {
    return res.status(400).json({ error: 'MAC address and user ID required' });
  }

  try {
    const device = await Device.findOne({ mac });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Link device to user
    device.userId = userId;
    await device.save();

    await LogModel.create({
      level: 'info',
      source: 'device-registration',
      message: 'device-linked-to-user',
      metadata: { mac, userId, deviceId: device._id }
    });

    res.json({ ok: true, message: 'Device linked to user account' });

  } catch (err) {
    logger.error('Device linking failed', { err: err.message, mac, userId });
    res.status(500).json({ error: 'Device linking failed' });
  }
});

/**
 * POST /api/devices/detect
 * Try to detect device information from request headers
 */
router.post('/detect', async (req, res) => {
  try {
    // Try to get device info from various sources
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || req.headers['x-real-ip'];
    const userAgent = req.headers['user-agent'];

    // Log the detection attempt
    await LogModel.create({
      level: 'info',
      source: 'device-detection',
      message: 'device-detection-attempt',
      metadata: {
        clientIP,
        userAgent: userAgent?.substring(0, 100),
        headers: Object.keys(req.headers)
      }
    });

    // For now, return basic info - in production you might want to use
    // more sophisticated device fingerprinting
    res.json({
      ok: true,
      ip: clientIP,
      userAgent: userAgent?.substring(0, 100),
      timestamp: new Date().toISOString(),
      message: 'Device detection completed - MAC address requires MikroTik integration'
    });

  } catch (err) {
    logger.error('Device detection failed', { err: err.message });
    res.status(500).json({ error: 'Device detection failed' });
  }
});

/**
 * GET /api/devices/:mac
 * Get device information by MAC address
 */
router.get('/:mac', async (req, res) => {
  const { mac } = req.params;

  try {
    const device = await Device.findOne({ mac }).populate('userId', 'name phone email');
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({
      ok: true,
      device: {
        id: device._id,
        mac: device.mac,
        ip: device.ip,
        registeredAt: device.registeredAt,
        lastSeen: device.lastSeen,
        hasUser: !!device.userId,
        user: device.userId
      }
    });

  } catch (err) {
    logger.error('Device lookup failed', { err: err.message, mac });
    res.status(500).json({ error: 'Device lookup failed' });
  }
});

module.exports = router;
