const express = require('express');
const router = express.Router();
const { grantAccess } = require('../lib/mikrotik');
const LogModel = require('../models/Log');
const logger = require('../utils/logger');

/**
 * GET /api/mikrotik/test - Test endpoint to verify MikroTik routes are working
 */
router.get('/test', (req, res) => {
    res.json({
        status: 'ok',
        message: 'MikroTik routes are working',
        timestamp: new Date().toISOString(),
        endpoint: '/api/mikrotik/login'
    });
});

/**
 * GET /api/mikrotik/simple - Simple test endpoint for login route
 */
router.get('/simple', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Simple MikroTik route works',
        query: req.query,
        timestamp: new Date().toISOString()
    });
});

/**
 * POST /api/mikrotik/capture-device
 * Capture device info when frontend has temporary access
 */
router.post('/capture-device', async (req, res) => {
    try {
        const { mac, ip, userAgent, timestamp } = req.body;

        // Get client IP from request
        const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || req.headers['x-real-ip'];

        logger.info('Device capture request received', { mac, ip, clientIP, userAgent });

        // Create or update device record
        const Device = require('../models/Device');
        let device = await Device.findOne({ mac: mac || clientIP });

        if (!device && (mac || clientIP)) {
            // Create new device record
            device = new Device({
                mac: mac || clientIP,
                ip: ip || clientIP,
                registeredAt: new Date(),
                lastSeen: new Date()
            });
            await device.save();

            await LogModel.create({
                level: 'info',
                source: 'device-capture',
                message: 'device-captured-from-frontend',
                metadata: { mac: mac || clientIP, ip: ip || clientIP, userAgent, deviceId: device._id }
            });

            logger.info('Device captured from frontend', { mac: mac || clientIP, ip: ip || clientIP, deviceId: device._id });
        } else if (device) {
            // Update existing device
            device.ip = ip || clientIP;
            device.lastSeen = new Date();
            await device.save();

            await LogModel.create({
                level: 'info',
                source: 'device-capture',
                message: 'device-updated-from-frontend',
                metadata: { mac: mac || clientIP, ip: ip || clientIP, deviceId: device._id }
            });
        }

        res.json({
            ok: true,
            message: 'Device captured successfully',
            device: {
                mac: mac || clientIP,
                ip: ip || clientIP,
                deviceId: device?._id
            }
        });

    } catch (err) {
        logger.error('Device capture failed', { err: err.message, stack: err.stack });
        res.status(500).json({ error: 'Device capture failed' });
    }
});

/**
 * GET /api/mikrotik/device-info
 * Get device information for the current request
 * This endpoint detects device info from request headers and IP
 */
router.get('/device-info', async (req, res) => {
    try {
        // Get client information from request - prioritize real client IP
        let clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers['x-real-ip'] ||
            req.headers['cf-connecting-ip'] ||
            req.headers['true-client-ip'] ||
            req.ip ||
            req.connection.remoteAddress;

        // Filter out localhost and IPv6 localhost
        if (clientIP === '::1' || clientIP === '127.0.0.1' || clientIP === 'localhost') {
            // Try to get real IP from other headers
            clientIP = req.headers['x-vercel-forwarded-for']?.split(',')[0]?.trim() ||
                req.headers['x-forwarded-for']?.split(',')[1]?.trim() ||
                req.headers['x-real-ip'] ||
                'unknown';
        }
        const userAgent = req.headers['user-agent'];

        // Try to extract MAC address from various headers that routers might send
        const possibleMacHeaders = [
            'x-mac-address',
            'x-client-mac',
            'mac-address',
            'x-forwarded-mac',
            'x-real-mac',
            'client-mac',
            'device-mac',
            'mac',
            'x-mikrotik-mac',
            'x-router-mac',
            'x-device-mac',
            'x-captive-portal-mac',
            'x-hotspot-mac',
            'x-wifi-mac',
            'x-ether-mac'
        ];

        let macFromHeader = null;
        for (const header of possibleMacHeaders) {
            if (req.headers[header]) {
                macFromHeader = req.headers[header];
                break;
            }
        }

        // Also check query parameters (MikroTik might pass MAC in URL)
        const macFromQuery = req.query.mac || req.query['mac-address'];

        // Use the first available MAC address
        const detectedMac = macFromHeader || macFromQuery;

        logger.info('Device info request received', {
            clientIP,
            userAgent: userAgent?.substring(0, 100),
            detectedMac,
            macFromHeader,
            macFromQuery,
            allHeaders: Object.keys(req.headers),
            queryParams: Object.keys(req.query),
            headers: req.headers // Log all headers for debugging
        });

        // Create or update device record
        const Device = require('../models/Device');

        // Try to find existing device by MAC or IP
        let device = null;
        if (detectedMac) {
            device = await Device.findOne({ mac: detectedMac });
        }
        if (!device) {
            device = await Device.findOne({ ip: clientIP });
        }

        // If device found but MAC is the same as another device, create new one
        if (device && device.mac) {
            const existingDeviceWithSameMac = await Device.findOne({
                mac: device.mac,
                _id: { $ne: device._id }
            });
            if (existingDeviceWithSameMac) {
                // Create new device to avoid MAC conflicts
                device = null;
            }
        }

        if (!device) {
            // Create new device record with detected or generated MAC
            let deviceMac;
            if (detectedMac) {
                deviceMac = detectedMac;
            } else {
                // Generate a proper MAC address format (AA:BB:CC:DD:EE:FF)
                // Use timestamp and random to ensure uniqueness
                const generateMacAddress = () => {
                    const hex = '0123456789ABCDEF';
                    let mac = '';
                    const timestamp = Date.now().toString(16).slice(-4); // Last 4 hex digits of timestamp

                    for (let i = 0; i < 6; i++) {
                        if (i > 0) mac += ':';
                        if (i < 2) {
                            // Use timestamp for first 2 octets to ensure uniqueness
                            const timeHex = timestamp.slice(i * 2, (i + 1) * 2);
                            mac += timeHex.padStart(2, '0');
                        } else {
                            // Use random for remaining octets
                            mac += hex[Math.floor(Math.random() * 16)];
                            mac += hex[Math.floor(Math.random() * 16)];
                        }
                    }
                    return mac;
                };
                deviceMac = generateMacAddress();
            }

            device = new Device({
                mac: deviceMac,
                ip: clientIP,
                registeredAt: new Date(),
                lastSeen: new Date(),
                detectionMethod: detectedMac ? 'header-detected' : 'generated'
            });
            await device.save();

            await LogModel.create({
                level: 'info',
                source: 'device-detection',
                message: 'device-auto-detected',
                metadata: {
                    mac: device.mac,
                    ip: clientIP,
                    userAgent: userAgent?.substring(0, 100),
                    deviceId: device._id,
                    detectionMethod: device.detectionMethod,
                    headers: Object.keys(req.headers),
                    queryParams: Object.keys(req.query)
                }
            });

            logger.info('Device auto-detected', {
                mac: device.mac,
                ip: clientIP,
                deviceId: device._id,
                detectionMethod: device.detectionMethod
            });
        } else {
            // Update existing device
            device.ip = clientIP;
            device.lastSeen = new Date();

            // Check if current MAC is invalid (like DETECTED-::1) and update it
            if (device.mac && (device.mac.startsWith('DETECTED-') || device.mac.startsWith('auto-'))) {
                if (detectedMac) {
                    device.mac = detectedMac;
                } else {
                    // Generate a proper MAC address format (AA:BB:CC:DD:EE:FF)
                    // Use client IP and timestamp to ensure uniqueness
                    const generateMacAddress = () => {
                        const hex = '0123456789ABCDEF';
                        let mac = '';

                        // Use client IP hash for first 3 octets to make it more unique per device
                        const ipHash = clientIP.split('.').reduce((acc, octet) => acc + parseInt(octet), 0);
                        const timestamp = Date.now().toString(16).slice(-6); // Last 6 hex digits

                        for (let i = 0; i < 6; i++) {
                            if (i > 0) mac += ':';
                            if (i < 3) {
                                // Use IP-based hash for first 3 octets
                                const hashValue = (ipHash + i) % 256;
                                mac += hashValue.toString(16).padStart(2, '0').toUpperCase();
                            } else {
                                // Use timestamp for last 3 octets
                                const timeIndex = (i - 3) * 2;
                                const timeHex = timestamp.slice(timeIndex, timeIndex + 2);
                                mac += timeHex.padStart(2, '0').toUpperCase();
                            }
                        }
                        return mac;
                    };
                    device.mac = generateMacAddress();
                    device.detectionMethod = 'generated-updated';
                }
            } else if (detectedMac && device.mac !== detectedMac) {
                device.mac = detectedMac; // Update MAC if we got a better one
            }
            await device.save();
        }

        res.json({
            ok: true,
            device: {
                mac: device.mac,
                ip: device.ip,
                deviceId: device._id,
                registeredAt: device.registeredAt,
                lastSeen: device.lastSeen,
                hasUser: !!device.userId,
                detectionMethod: device.detectionMethod || 'unknown'
            },
            requestInfo: {
                clientIP,
                userAgent: userAgent?.substring(0, 100),
                timestamp: new Date().toISOString(),
                detectedMac: detectedMac,
                macSource: macFromHeader ? 'header' : macFromQuery ? 'query' : 'generated'
            }
        });

    } catch (err) {
        logger.error('Device info detection failed', { err: err.message, stack: err.stack });
        res.status(500).json({ error: 'Device detection failed' });
    }
});

/**
 * POST /api/mikrotik/free-trial
 * Grant free trial access to a device
 */
router.post('/free-trial', async (req, res) => {
    try {
        const { deviceId, mac, ip } = req.body;

        // Get client IP from request
        const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || req.headers['x-real-ip'];

        logger.info('Free trial request received', { deviceId, mac, ip, clientIP });

        // Find or create device
        const Device = require('../models/Device');
        let device;

        if (deviceId) {
            device = await Device.findById(deviceId);
        } else if (mac || clientIP) {
            device = await Device.findOne({
                $or: [
                    { mac: mac || clientIP },
                    { ip: clientIP }
                ]
            });
        }

        if (!device) {
            // Create new device
            device = new Device({
                mac: mac || `detected-${clientIP}`,
                ip: ip || clientIP,
                registeredAt: new Date(),
                lastSeen: new Date()
            });
            await device.save();
        }

        // Check if device already has active subscription
        const Subscription = require('../models/Subscription');
        const activeSubscription = await Subscription.findOne({
            deviceId: device._id,
            status: 'active',
            endAt: { $gt: new Date() }
        });

        if (activeSubscription) {
            return res.json({
                ok: true,
                message: 'Device already has active subscription',
                subscription: activeSubscription,
                device: {
                    mac: device.mac,
                    ip: device.ip,
                    deviceId: device._id
                }
            });
        }

        // Check if this device has already used free trial (by MAC address)
        const deviceFreeTrialUsed = await Subscription.findOne({
            'devices.mac': device.mac,
            packageKey: 'free-trial'
        });

        if (deviceFreeTrialUsed) {
            return res.json({
                ok: false,
                message: 'This device has already used the free trial',
                device: {
                    mac: device.mac,
                    ip: device.ip,
                    deviceId: device._id
                }
            });
        }

        // Grant free trial access (1 hour)
        const freeTrialDuration = 60 * 60 * 1000; // 1 hour in milliseconds
        const endAt = new Date(Date.now() + freeTrialDuration);

        // Grant access in MikroTik
        let mikrotikSuccess = false;
        try {
            logger.info('Attempting to grant MikroTik access', {
                mac: device.mac,
                ip: device.ip,
                endAt: endAt,
                mikrotikConfig: {
                    host: process.env.MI_HOST || '100.122.97.19',
                    port: process.env.MI_API_PORT || 8728,
                    user: process.env.MI_API_USER || 'kim_admin'
                }
            });

            await grantAccess({
                mac: device.mac,
                ip: device.ip,
                comment: `free-trial:${new Date().toISOString()}`,
                until: endAt
            });

            mikrotikSuccess = true;
            logger.info('Free trial access granted in MikroTik', { mac: device.mac, ip: device.ip, endAt });
        } catch (mikrotikErr) {
            logger.error('Failed to grant MikroTik access', {
                err: mikrotikErr.message,
                mac: device.mac,
                ip: device.ip,
                mikrotikConfig: {
                    host: process.env.MI_HOST || '100.122.97.19',
                    port: process.env.MI_API_PORT || 8728,
                    user: process.env.MI_API_USER || 'kim_admin'
                }
            });

            // Log the specific error for debugging
            await LogModel.create({
                level: 'error',
                source: 'mikrotik-connection',
                message: 'mikrotik-connection-failed',
                metadata: {
                    error: mikrotikErr.message,
                    mac: device.mac,
                    ip: device.ip,
                    endAt: endAt,
                    stack: mikrotikErr.stack,
                    mikrotikConfig: {
                        host: process.env.MI_HOST || '100.122.97.19',
                        port: process.env.MI_API_PORT || 8728,
                        user: process.env.MI_API_USER || 'kim_admin'
                    }
                }
            });
        }

        // Create subscription record with proper speed information
        const subscription = new Subscription({
            deviceId: device._id,
            packageKey: 'free-trial',
            packageName: 'Free Trial',
            status: 'active',
            startAt: new Date(),
            endAt: endAt,
            priceKES: 0,
            speedKbps: 2000, // 2 Mbps for free trial
            durationSeconds: 3600, // 1 hour in seconds
            paymentMethod: 'free-trial',
            devices: [{ mac: device.mac, label: 'Free Trial Device' }]
        });
        await subscription.save();

        await LogModel.create({
            level: 'info',
            source: 'free-trial',
            message: 'free-trial-granted',
            metadata: {
                deviceId: device._id,
                mac: device.mac,
                ip: device.ip,
                subscriptionId: subscription._id,
                endAt: endAt
            }
        });

        res.json({
            ok: true,
            message: mikrotikSuccess ? 'Free trial access granted' : 'Free trial subscription created (MikroTik connection failed)',
            subscription: {
                id: subscription._id,
                packageName: 'Free Trial',
                endAt: endAt,
                duration: '1 hour'
            },
            device: {
                mac: device.mac,
                ip: device.ip,
                deviceId: device._id
            },
            mikrotikStatus: {
                connected: mikrotikSuccess,
                message: mikrotikSuccess ? 'Access granted in MikroTik' : 'MikroTik connection failed - manual configuration may be required',
                manualConfig: !mikrotikSuccess ? {
                    mac: device.mac,
                    ip: device.ip,
                    duration: '1 hour',
                    instructions: 'Please manually configure MikroTik router to allow this device access'
                } : null
            }
        });

    } catch (err) {
        logger.error('Free trial grant failed', { err: err.message, stack: err.stack });
        res.status(500).json({ error: 'Free trial grant failed' });
    }
});

/**
 * POST /api/mikrotik/manual-device
 * Manually register device with MAC address provided by user
 */
router.post('/manual-device', async (req, res) => {
    try {
        const { mac, ip, userAgent } = req.body;

        // Get client IP from request
        const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || req.headers['x-real-ip'];

        if (!mac) {
            return res.status(400).json({ error: 'MAC address is required' });
        }

        logger.info('Manual device registration received', { mac, ip, clientIP, userAgent });

        // Create or update device record
        const Device = require('../models/Device');
        let device = await Device.findOne({ mac: mac });

        if (!device) {
            // Create new device record
            device = new Device({
                mac: mac,
                ip: ip || clientIP,
                registeredAt: new Date(),
                lastSeen: new Date(),
                detectionMethod: 'manual-input'
            });
            await device.save();

            await LogModel.create({
                level: 'info',
                source: 'manual-device',
                message: 'device-manually-registered',
                metadata: {
                    mac: mac,
                    ip: ip || clientIP,
                    userAgent: userAgent?.substring(0, 100),
                    deviceId: device._id
                }
            });

            logger.info('Device manually registered', { mac: mac, ip: ip || clientIP, deviceId: device._id });
        } else {
            // Update existing device
            device.ip = ip || clientIP;
            device.lastSeen = new Date();
            await device.save();
        }

        res.json({
            ok: true,
            message: 'Device registered successfully',
            device: {
                mac: device.mac,
                ip: device.ip,
                deviceId: device._id,
                registeredAt: device.registeredAt,
                lastSeen: device.lastSeen,
                hasUser: !!device.userId,
                detectionMethod: device.detectionMethod
            }
        });

    } catch (err) {
        logger.error('Manual device registration failed', { err: err.message, stack: err.stack });
        res.status(500).json({ error: 'Manual device registration failed' });
    }
});

/**
 * POST /api/mikrotik/manual-grant-access
 * Manually grant access in MikroTik when automatic connection fails
 */
router.post('/manual-grant-access', async (req, res) => {
    try {
        const { mac, ip, duration = 3600 } = req.body; // duration in seconds

        if (!mac) {
            return res.status(400).json({ error: 'MAC address is required' });
        }

        const endAt = new Date(Date.now() + (duration * 1000));

        logger.info('Manual grant access request received', { mac, ip, duration, endAt });

        // Try to grant access in MikroTik
        try {
            await grantAccess({
                mac: mac,
                ip: ip || '0.0.0.0',
                comment: `manual-grant:${new Date().toISOString()}`,
                until: endAt
            });

            logger.info('Manual access granted in MikroTik', { mac, ip, endAt });

            res.json({
                ok: true,
                message: 'Access granted successfully in MikroTik',
                access: {
                    mac: mac,
                    ip: ip,
                    endAt: endAt,
                    duration: `${duration} seconds`
                }
            });

        } catch (mikrotikErr) {
            logger.error('Manual MikroTik access failed', { err: mikrotikErr.message, mac, ip });

            res.json({
                ok: false,
                message: 'MikroTik connection failed',
                error: mikrotikErr.message,
                suggestion: 'Please check MikroTik router configuration and network connectivity'
            });
        }

    } catch (err) {
        logger.error('Manual grant access failed', { err: err.message, stack: err.stack });
        res.status(500).json({ error: 'Manual grant access failed' });
    }
});

/**
 * GET /api/mikrotik/login - MikroTik login page redirect
 * MikroTik will redirect users here with parameters like:
 * ?mac=AA:BB:CC&ip=192.168.88.101&chap-id=123&chap-challenge=abc&link-login=...
 */
router.get('/login', async (req, res) => {
    try {
        console.log('MikroTik login endpoint hit!', req.query);

        const {
            mac,
            ip,
            'chap-id': chapId,
            'chap-challenge': chapChallenge,
            'link-login': linkLogin,
            'link-orig': linkOrig,
            username,
            password
        } = req.query;

        // Log the MikroTik login attempt
        logger.info('MikroTik login redirect received', { mac, ip, chapId, username });
        await LogModel.create({
            level: 'info',
            source: 'mikrotik-login',
            message: 'login-redirect',
            metadata: { mac, ip, chapId, username }
        });

        // Auto-register device and check for active subscriptions
        if (mac) {
            try {
                const Device = require('../models/Device');
                const Subscription = require('../models/Subscription');
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
                        source: 'mikrotik-login',
                        message: 'device-auto-registered',
                        metadata: { mac, ip, deviceId: device._id }
                    });
                } else {
                    // Update existing device
                    device.ip = ip;
                    device.chapId = chapId;
                    device.chapChallenge = chapChallenge;
                    device.linkLogin = linkLogin;
                    device.linkOrig = linkOrig;
                    device.lastSeen = new Date();
                    await device.save();
                }

                // Check for active subscriptions and auto-reconnect
                const activeSubscription = await Subscription.findOne({
                    'devices.mac': mac,
                    active: true,
                    endAt: { $gt: new Date() }
                });

                if (activeSubscription) {
                    // Auto-grant access for users with active subscriptions
                    try {
                        await grantAccess({
                            mac,
                            ip,
                            comment: `auto-reconnect:${activeSubscription._id}`,
                            until: activeSubscription.endAt
                        });

                        await LogModel.create({
                            level: 'info',
                            source: 'mikrotik-login',
                            message: 'auto-reconnected',
                            metadata: { mac, ip, subscriptionId: activeSubscription._id }
                        });

                        logger.info('User auto-reconnected', { mac, ip, subscriptionId: activeSubscription._id });

                        // Redirect directly to success page for auto-reconnected users
                        const successUrl = `${process.env.FRONTEND_URL}/ads?auto-reconnected=true`;
                        return res.redirect(successUrl);
                    } catch (err) {
                        logger.error('Auto-reconnection failed', { err: err.message, mac, ip });
                    }
                }
            } catch (err) {
                logger.error('Device auto-registration failed', { err: err.message, mac, ip });
            }
        }

        // Grant temporary access and redirect to frontend
        // This allows frontend to work while we capture device info
        try {
            // Grant temporary access (10 minutes) so user can reach frontend
            await grantAccess({
                mac,
                ip,
                comment: `portal-access:${new Date().toISOString()}`,
                until: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
            });

            logger.info('Temporary access granted for frontend redirect', { mac, ip });
        } catch (err) {
            logger.error('Failed to grant temporary access', { err: err.message, mac, ip });
        }

        // Redirect to frontend with device parameters
        const frontendUrl = `${process.env.FRONTEND_URL}/portal?${new URLSearchParams(req.query).toString()}`;
        res.redirect(frontendUrl);

    } catch (err) {
        console.error('MikroTik login endpoint error:', err);
        logger.error('MikroTik login endpoint error', { err: err.message, stack: err.stack });

        // Fallback: Try to grant access anyway and redirect
        try {
            if (mac && ip) {
                await grantAccess({
                    mac,
                    ip,
                    comment: `fallback-access:${new Date().toISOString()}`,
                    until: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
                });
                logger.info('Fallback access granted', { mac, ip });
            }
        } catch (fallbackErr) {
            logger.error('Fallback access failed', { err: fallbackErr.message, mac, ip });
        }

        // Redirect to frontend even with errors
        const frontendUrl = `${process.env.FRONTEND_URL}/portal?${new URLSearchParams(req.query).toString()}`;
        res.redirect(frontendUrl);
    }
});

/**
 * POST /api/mikrotik/login - Process MikroTik login credentials
 * This is called when user submits login form from the portal
 */
router.post('/login', async (req, res) => {
    const {
        mac,
        ip,
        'chap-id': chapId,
        'chap-challenge': chapChallenge,
        'link-login': linkLogin,
        'link-orig': linkOrig,
        username,
        password
    } = req.body;

    try {
        logger.info('Processing MikroTik login', { mac, ip, username });

        // For now, we'll grant access to any valid credentials
        // In production, you might want to validate against a user database
        if (!mac) {
            return res.status(400).json({ error: 'MAC address required' });
        }

        // Grant access via MikroTik API
        await grantAccess({
            mac,
            ip,
            comment: `mikrotik-login:${username || 'anonymous'}`,
            until: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours default
        });

        await LogModel.create({
            level: 'info',
            source: 'mikrotik-login',
            message: 'login-success',
            metadata: { mac, ip, username }
        });

        // Redirect back to MikroTik with success
        const successUrl = `${linkLogin}?username=${username}&password=${password}&mac=${mac}&ip=${ip}`;
        res.redirect(successUrl);

    } catch (err) {
        logger.error('MikroTik login failed', { err: err.message, mac, ip });
        await LogModel.create({
            level: 'error',
            source: 'mikrotik-login',
            message: 'login-failed',
            metadata: { err: err.message, mac, ip }
        });

        // Redirect to failure page
        res.redirect(`${process.env.FRONTEND_URL}/portal?error=login_failed&mac=${mac}&ip=${ip}`);
    }
});

/**
 * GET /api/mikrotik/status - Check if device has active access
 */
router.get('/status/:mac', async (req, res) => {
    const { mac } = req.params;

    try {
        // Check if device has active subscription
        const Subscription = require('../models/Subscription');
        const activeSub = await Subscription.findOne({
            'devices.mac': mac,
            active: true,
            endAt: { $gt: new Date() }
        });

        res.json({
            hasAccess: !!activeSub,
            subscription: activeSub
        });
    } catch (err) {
        logger.error('Status check failed', { err: err.message, mac });
        res.status(500).json({ error: 'Status check failed' });
    }
});

module.exports = router;
