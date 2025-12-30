const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Package = require('../models/PackageModel');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Get all subscriptions for a user
router.get('/', verifyToken, async (req, res) => {
    try {
        const subscriptions = await Subscription.find({ userId: req.userId })
            .populate('packageKey', 'name speedKbps durationSeconds devicesAllowed')
            .sort({ createdAt: -1 });

        // Transform the data to match frontend expectations
        const transformedSubscriptions = subscriptions.map(sub => ({
            _id: sub._id,
            packageKey: sub.packageKey?.key || sub.packageKey,
            packageName: sub.packageName || sub.packageKey?.name || sub.packageKey,
            priceKES: sub.priceKES || sub.packageKey?.priceKES || 0,
            speedKbps: sub.speedKbps || sub.packageKey?.speedKbps || 0,
            durationSeconds: sub.durationSeconds || sub.packageKey?.durationSeconds || 0,
            devicesAllowed: sub.devicesAllowed || sub.packageKey?.devicesAllowed || 1,
            devices: sub.devices || [],
            startAt: sub.startAt,
            endAt: sub.endAt,
            status: sub.active ? 'active' : 'expired',
            paymentId: sub.paymentId
        }));

        res.json(transformedSubscriptions);
    } catch (error) {
        logger.error('Failed to get subscriptions:', error);
        res.status(500).json({ error: 'Failed to get subscriptions' });
    }
});

// Get a specific subscription
router.get('/:id', verifyToken, async (req, res) => {
    try {
        // Guard: ensure :id is a valid ObjectId to avoid catching other routes
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid subscription id' });
        }

        const subscription = await Subscription.findOne({
            _id: req.params.id,
            userId: req.userId
        }).populate('packageKey', 'name speedKbps durationSeconds devicesAllowed');

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        // Transform the data
        const transformedSubscription = {
            _id: subscription._id,
            packageKey: subscription.packageKey?.key || subscription.packageKey,
            packageName: subscription.packageName || subscription.packageKey?.name || subscription.packageKey,
            priceKES: subscription.priceKES || subscription.packageKey?.priceKES || 0,
            speedKbps: subscription.speedKbps || subscription.packageKey?.speedKbps || 0,
            durationSeconds: subscription.durationSeconds || subscription.packageKey?.durationSeconds || 0,
            devicesAllowed: subscription.devicesAllowed || subscription.packageKey?.devicesAllowed || 1,
            devices: subscription.devices || [],
            startAt: subscription.startAt,
            endAt: subscription.endAt,
            status: subscription.active ? 'active' : 'expired',
            paymentId: subscription.paymentId
        };

        res.json(transformedSubscription);
    } catch (error) {
        logger.error('Failed to get subscription:', error);
        res.status(500).json({ error: 'Failed to get subscription' });
    }
});

// Claim free trial
router.post('/free-trial', verifyToken, async (req, res) => {
    try {
        const { mac } = req.body;
        if (!mac) return res.status(400).json({ error: 'MAC address required' });

        // Check if user has already used free trial
        const user = await User.findById(req.userId);
        if (user.freeTrialUsed) {
            return res.status(400).json({ error: 'Free trial already used' });
        }

        // Check if user already has an active free trial
        const existingFreeTrial = await Subscription.findOne({
            userId: req.userId,
            packageKey: 'free-trial',
            active: true
        });

        if (existingFreeTrial) {
            return res.status(400).json({ error: 'Free trial already active' });
        }

        // Create free trial package if it doesn't exist
        let freeTrialPackage = await Package.findOne({ key: 'free-trial' });
        if (!freeTrialPackage) {
            freeTrialPackage = new Package({
                key: 'free-trial',
                name: 'Free Trial',
                priceKES: 0,
                durationSeconds: 24 * 60 * 60, // 24 hours
                speedKbps: 1000, // 1 Mbps
                devicesAllowed: 1
            });
            await freeTrialPackage.save();
        }

        // Create free trial subscription
        const now = new Date();
        const endTime = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // 24 hours from now

        const subscription = new Subscription({
            userId: req.userId,
            packageKey: 'free-trial',
            devices: [{ mac: mac.toUpperCase(), label: 'Free Trial Device' }],
            startAt: now,
            endAt: endTime,
            active: true,
            mikrotikEntry: `free-trial-${req.userId}-${Date.now()}`
        });

        await subscription.save();

        // Mark user as having used free trial
        user.freeTrialUsed = true;
        await user.save();

        // TODO: Grant access via MikroTik API
        // await mikrotik.grantAccess(subscription.mikrotikEntry, mac);

        logger.info('Free trial claimed', { userId: req.userId, subscriptionId: subscription._id });

        res.json({
            ok: true,
            message: 'Free trial claimed successfully',
            subscription: {
                _id: subscription._id,
                packageKey: 'free-trial',
                packageName: 'Free Trial',
                priceKES: 0,
                speedKbps: 1000,
                durationSeconds: 24 * 60 * 60,
                devicesAllowed: 1,
                devices: subscription.devices,
                startAt: subscription.startAt,
                endAt: subscription.endAt,
                status: 'active'
            }
        });
    } catch (error) {
        logger.error('Failed to claim free trial:', error);
        res.status(500).json({ error: 'Failed to claim free trial' });
    }
});

// Add device to subscription
router.post('/:id/devices', verifyToken, async (req, res) => {
    try {
        const { mac, label } = req.body;
        if (!mac) return res.status(400).json({ error: 'MAC address required' });

        const subscription = await Subscription.findOne({
            _id: req.params.id,
            userId: req.userId
        }).populate('packageKey');

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        if (!subscription.active) {
            return res.status(400).json({ error: 'Subscription is not active' });
        }

        // Check device limit
        const currentDevices = subscription.devices?.length || 0;
        const maxDevices = subscription.packageKey?.devicesAllowed || 1;

        if (currentDevices >= maxDevices) {
            return res.status(400).json({ error: 'Device limit reached' });
        }

        // Add device
        const newDevice = {
            mac: mac.toUpperCase(),
            label: label || 'Unnamed Device',
            addedAt: new Date()
        };

        if (!subscription.devices) subscription.devices = [];
        subscription.devices.push(newDevice);
        await subscription.save();

        // TODO: Grant access via MikroTik API
        // await mikrotik.grantAccess(subscription.mikrotikEntry, mac);

        res.json({ ok: true, message: 'Device added successfully' });
    } catch (error) {
        logger.error('Failed to add device:', error);
        res.status(500).json({ error: 'Failed to add device' });
    }
});

// Check MikroTik connection status
router.get('/status/connection', verifyToken, async (req, res) => {
    try {
        const { grantAccess } = require('../lib/mikrotik');

        // Test connection with a dummy MAC
        const testMac = 'AA:BB:CC:DD:EE:FF';
        const testIp = '192.168.1.100';

        try {
            await grantAccess({
                mac: testMac,
                ip: testIp,
                comment: 'connection-test',
                until: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
            });

            res.json({
                ok: true,
                message: 'MikroTik connection is working',
                status: 'connected'
            });

        } catch (mikrotikErr) {
            res.json({
                ok: false,
                message: 'MikroTik connection failed',
                status: 'disconnected',
                error: {
                    message: mikrotikErr.message,
                    type: mikrotikErr.name,
                    code: mikrotikErr.code
                },
                troubleshooting: {
                    steps: [
                        'Check if Tailscale is running on the router',
                        'Verify RouterOS API is enabled',
                        'Check firewall rules',
                        'Test network connectivity'
                    ],
                    documentation: 'See MIKROTIK_TROUBLESHOOTING.md for detailed steps'
                }
            });
        }

    } catch (error) {
        logger.error('Connection status check failed:', error);
        res.status(500).json({
            error: 'Failed to check connection status',
            details: error.message
        });
    }
});

// Reconnect user devices - grant access for active subscriptions
router.post('/reconnect', verifyToken, async (req, res) => {
    try {
        const { mac, ip } = req.body;

        if (!mac) {
            return res.status(400).json({ error: 'MAC address required' });
        }

        // Find active subscriptions for this user
        const activeSubscriptions = await Subscription.find({
            userId: req.userId,
            active: true,
            endAt: { $gt: new Date() },
            $or: [
                { 'devices.mac': mac },
                { deviceId: { $exists: true } }
            ]
        });

        if (activeSubscriptions.length === 0) {
            return res.status(404).json({
                ok: false,
                message: 'No active subscription found for this device',
                suggestion: 'Please purchase a package to get internet access'
            });
        }

        // Grant access via MikroTik for all active subscriptions
        const { grantAccess } = require('../lib/mikrotik');
        const results = [];

        for (const subscription of activeSubscriptions) {
            try {
                await grantAccess({
                    mac: mac,
                    ip: ip || 'auto-detect',
                    comment: `reconnect:${subscription._id}`,
                    until: subscription.endAt
                });

                results.push({
                    subscriptionId: subscription._id,
                    packageName: subscription.packageName || subscription.packageKey,
                    success: true,
                    message: 'Access granted successfully'
                });

                logger.info('Device reconnected successfully', {
                    userId: req.userId,
                    mac,
                    ip,
                    subscriptionId: subscription._id
                });

            } catch (mikrotikErr) {
                logger.error('Failed to reconnect device via MikroTik', {
                    err: mikrotikErr.message,
                    userId: req.userId,
                    mac,
                    ip,
                    subscriptionId: subscription._id,
                    errorType: mikrotikErr.name,
                    isRosException: mikrotikErr.name === 'RosException'
                });

                // Provide more helpful error messages based on error type
                let errorMessage = 'MikroTik connection failed';
                if (mikrotikErr.name === 'RosException') {
                    errorMessage = 'Router connection failed - please check router status';
                } else if (mikrotikErr.message.includes('timeout')) {
                    errorMessage = 'Connection timeout - router may be offline';
                } else if (mikrotikErr.message.includes('ECONNREFUSED')) {
                    errorMessage = 'Connection refused - check router API settings';
                }

                results.push({
                    subscriptionId: subscription._id,
                    packageName: subscription.packageName || subscription.packageKey,
                    success: false,
                    message: errorMessage,
                    technicalDetails: {
                        error: mikrotikErr.message,
                        type: mikrotikErr.name,
                        suggestion: 'Please contact support if this issue persists'
                    }
                });
            }
        }

        const allSuccessful = results.every(r => r.success);
        const successfulCount = results.filter(r => r.success).length;

        res.json({
            ok: allSuccessful,
            message: allSuccessful
                ? 'All devices reconnected successfully'
                : `${successfulCount}/${results.length} devices reconnected`,
            results: results,
            totalActiveSubscriptions: activeSubscriptions.length
        });

    } catch (error) {
        logger.error('Reconnect failed:', error);
        res.status(500).json({ error: 'Reconnect failed' });
    }
});

// Update device
router.put('/:id/devices/:deviceId', verifyToken, async (req, res) => {
    try {
        const { mac, label } = req.body;
        if (!mac) return res.status(400).json({ error: 'MAC address required' });

        const subscription = await Subscription.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        const deviceIndex = subscription.devices.findIndex(device =>
            device._id?.toString() === req.params.deviceId
        );

        if (deviceIndex === -1) {
            return res.status(404).json({ error: 'Device not found' });
        }

        // Update device
        subscription.devices[deviceIndex].mac = mac.toUpperCase();
        subscription.devices[deviceIndex].label = label || 'Unnamed Device';
        subscription.devices[deviceIndex].updatedAt = new Date();

        await subscription.save();

        res.json({ ok: true, message: 'Device updated successfully' });
    } catch (error) {
        logger.error('Failed to update device:', error);
        res.status(500).json({ error: 'Failed to update device' });
    }
});

// Remove device from subscription
router.delete('/:id/devices/:deviceId', verifyToken, async (req, res) => {
    try {
        const subscription = await Subscription.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        const deviceIndex = subscription.devices.findIndex(device =>
            device._id?.toString() === req.params.deviceId
        );

        if (deviceIndex === -1) {
            return res.status(404).json({ error: 'Device not found' });
        }

        const device = subscription.devices[deviceIndex];

        // Remove device
        subscription.devices.splice(deviceIndex, 1);
        await subscription.save();

        // TODO: Revoke access via MikroTik API
        // await mikrotik.revokeAccess(subscription.mikrotikEntry, device.mac);

        res.json({ ok: true, message: 'Device removed successfully' });
    } catch (error) {
        logger.error('Failed to remove device:', error);
        res.status(500).json({ error: 'Failed to remove device' });
    }
});

module.exports = router;

