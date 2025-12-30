const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Subscription = require('../models/Subscription');
const Voucher = require('../models/Voucher');
const Payment = require('../models/Payment');
const Package = require('../models/PackageModel');
const LogModel = require('../models/Log');
const Device = require('../models/Device');
const User = require('../models/User');

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-passwordHash');

        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Get all users (admin only)
router.get('/users', authenticateAdmin, async (req, res) => {
    try {
        const users = await User.find({}).select('-passwordHash');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get all devices (admin only)
router.get('/devices', authenticateAdmin, async (req, res) => {
    try {
        const devices = await Device.find({}).populate('userId', 'name phone email');
        res.json(devices);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch devices' });
    }
});

// Get all subscriptions (admin only)
router.get('/subscriptions', authenticateAdmin, async (req, res) => {
    try {
        const subscriptions = await Subscription.find({}).populate('userId', 'name phone email');
        res.json(subscriptions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
});

// System health check
router.get('/health', authenticateAdmin, async (req, res) => {
    try {
        const health = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.env.npm_package_version || '1.0.0'
        };
        res.json(health);
    } catch (error) {
        res.status(500).json({ error: 'Health check failed' });
    }
});

// Update user (admin only)
router.put('/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user (admin only)
router.delete('/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Update device (admin only)
router.put('/devices/:mac', authenticateAdmin, async (req, res) => {
    try {
        const { mac } = req.params;
        const updateData = req.body;

        const device = await Device.findOneAndUpdate({ mac: mac.toUpperCase() }, updateData, { new: true }).populate('userId', 'name phone email');
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        res.json(device);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update device' });
    }
});

// Update subscription (admin only)
router.put('/subscriptions/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const subscription = await Subscription.findByIdAndUpdate(id, updateData, { new: true }).populate('userId', 'name phone email');
        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        res.json(subscription);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update subscription' });
    }
});

// Delete subscription (admin only)
router.delete('/subscriptions/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const subscription = await Subscription.findByIdAndDelete(id);
        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        res.json({ message: 'Subscription deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete subscription' });
    }
});

// Update package (admin only)
router.put('/packages/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const package = await Package.findByIdAndUpdate(id, updateData, { new: true });
        if (!package) {
            return res.status(404).json({ error: 'Package not found' });
        }

        res.json(package);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update package' });
    }
});

// Delete package (admin only)
router.delete('/packages/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const package = await Package.findByIdAndDelete(id);
        if (!package) {
            return res.status(404).json({ error: 'Package not found' });
        }

        res.json({ message: 'Package deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete package' });
    }
});

// Update voucher (admin only)
router.put('/vouchers/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const voucher = await Voucher.findByIdAndUpdate(id, updateData, { new: true });
        if (!voucher) {
            return res.status(404).json({ error: 'Voucher not found' });
        }

        res.json(voucher);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update voucher' });
    }
});

// Delete voucher (admin only)
router.delete('/vouchers/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const voucher = await Voucher.findByIdAndDelete(id);
        if (!voucher) {
            return res.status(404).json({ error: 'Voucher not found' });
        }

        res.json({ message: 'Voucher deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete voucher' });
    }
});

// Admin login endpoint
router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        await LogModel.create({
            level: 'info',
            source: 'admin-auth',
            message: 'admin-login',
            metadata: { adminId: user._id, email: user.email }
        });

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create admin user endpoint
router.post('/auth/create-admin', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        // Check if admin already exists
        const existingAdmin = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { role: 'admin' }
            ]
        });

        if (existingAdmin) {
            return res.status(400).json({ error: 'Admin user already exists' });
        }

        // Create admin user
        const adminUser = new User({
            name,
            email: email.toLowerCase(),
            role: 'admin',
            phone: '0000000000' // Placeholder for admin
        });

        await adminUser.setPassword(password);
        await adminUser.save();

        await LogModel.create({
            level: 'info',
            source: 'admin-auth',
            message: 'admin-user-created',
            metadata: { adminId: adminUser._id, email: adminUser.email }
        });

        res.json({
            success: true,
            message: 'Admin user created successfully',
            user: {
                id: adminUser._id,
                name: adminUser.name,
                email: adminUser.email,
                role: adminUser.role
            }
        });
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Admin endpoints (protected with admin auth)
 */

// get active subscriptions
router.get('/active-subscriptions', authenticateAdmin, async (req, res) => {
    const subs = await Subscription.find({ active: true }).sort({ endAt: 1 });
    res.json(subs);
});

router.get('/payments', authenticateAdmin, async (req, res) => {
    const p = await Payment.find().sort({ createdAt: -1 }).limit(100);
    res.json(p);
});

router.get('/logs', authenticateAdmin, async (req, res) => {
    const q = req.query.q || '';
    const logs = await LogModel.find({ message: new RegExp(q, 'i') }).sort({ createdAt: -1 }).limit(200);
    res.json(logs);
});

router.get('/vouchers', authenticateAdmin, async (req, res) => {
    const v = await Voucher.find().sort({ createdAt: -1 }).limit(200);
    res.json(v);
});

// get packages
router.get('/packages', authenticateAdmin, async (req, res) => {
    const pkg = await Package.find().sort({ priceKES: 1 });
    res.json(pkg);
});

// create package
router.post('/packages/create', authenticateAdmin, async (req, res) => {
    const { key, name, priceKES, durationSeconds, speedKbps, devicesAllowed = 1 } = req.body;

    // Validate required fields
    if (!key || !name || priceKES === undefined || !durationSeconds || !speedKbps) {
        return res.status(400).json({ error: 'Missing required fields: key, name, priceKES, durationSeconds, speedKbps' });
    }

    try {
        const pkg = await Package.create({ key, name, priceKES, durationSeconds, speedKbps, devicesAllowed });
        await LogModel.create({ level: 'info', source: 'admin', message: 'package-created', metadata: { packageKey: key, name } });
        res.json({ ok: true, package: pkg });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Package key already exists' });
        }
        res.status(500).json({ error: 'Failed to create package' });
    }
});

// create multiple packages (bulk)
router.post('/packages/bulk-create', authenticateAdmin, async (req, res) => {
    const { packages } = req.body;

    if (!Array.isArray(packages) || packages.length === 0) {
        return res.status(400).json({ error: 'packages array is required' });
    }

    try {
        const created = [];
        const errors = [];

        for (const pkgData of packages) {
            try {
                const pkg = await Package.create(pkgData);
                created.push(pkg);
            } catch (err) {
                if (err.code === 11000) {
                    errors.push({ key: pkgData.key, error: 'Package key already exists' });
                } else {
                    errors.push({ key: pkgData.key, error: err.message });
                }
            }
        }

        await LogModel.create({
            level: 'info',
            source: 'admin',
            message: 'packages-bulk-created',
            metadata: { created: created.length, errors: errors.length }
        });

        res.json({
            ok: true,
            created: created.length,
            errors: errors.length,
            packages: created,
            errorDetails: errors
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create packages' });
    }
});

// create voucher(s)
router.post('/vouchers/create', authenticateAdmin, async (req, res) => {
    try {
        const { packageKey, count = 1, code, value, type = 'single', active = true, expiresAt, notes, maxUses = 1 } = req.body;

        // If single voucher creation with specific data
        if (code && packageKey) {
            const pkg = await Package.findOne({ key: packageKey });
            if (!pkg) return res.status(400).json({ error: 'Invalid package' });

            const voucherData = {
                code,
                packageKey: pkg.key,
                valueKES: value || pkg.priceKES,
                durationSeconds: pkg.durationSeconds,
                type,
                active,
                maxUses,
                notes
            };

            if (expiresAt) {
                voucherData.expiresAt = new Date(expiresAt);
            }

            const voucher = await Voucher.create(voucherData);
            await LogModel.create({ level: 'info', source: 'admin', message: 'voucher-created', metadata: { code, packageKey } });
            return res.json(voucher);
        }

        // Bulk creation
        const pkg = await Package.findOne({ key: packageKey });
        if (!pkg) return res.status(400).json({ error: 'Invalid package' });

        const created = [];
        for (let i = 0; i < count; i++) {
            const voucherCode = code || (Math.random().toString(36).slice(2, 10)).toUpperCase();
            const voucherData = {
                code: voucherCode,
                packageKey: pkg.key,
                valueKES: value || pkg.priceKES,
                durationSeconds: pkg.durationSeconds,
                type,
                active,
                maxUses
            };

            if (expiresAt) {
                voucherData.expiresAt = new Date(expiresAt);
            }

            const v = await Voucher.create(voucherData);
            created.push(v);
        }

        await LogModel.create({ level: 'info', source: 'admin', message: 'vouchers-created', metadata: { count, packageKey } });
        res.json({ ok: true, created });
    } catch (error) {
        console.error('Voucher creation error:', error);
        res.status(500).json({ error: 'Failed to create voucher' });
    }
});

module.exports = router;
