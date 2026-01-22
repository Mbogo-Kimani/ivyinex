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

// Get all users (admin only) - excludes admins
router.get('/users', authenticateAdmin, async (req, res) => {
    try {
        // Only return regular users, not admins
        const users = await User.find({ role: { $ne: 'admin' } }).select('-passwordHash').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get single user by ID (admin only)
router.get('/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
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

// Get single device by MAC (admin only)
router.get('/devices/:mac', authenticateAdmin, async (req, res) => {
    try {
        const { mac } = req.params;
        const device = await Device.findOne({ mac: mac.toUpperCase() }).populate('userId', 'name phone email');
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        res.json(device);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch device' });
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

// Get single subscription by ID (admin only)
router.get('/subscriptions/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const subscription = await Subscription.findById(id).populate('userId', 'name phone email');
        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }
        res.json(subscription);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch subscription' });
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

// Get all admins (admin only)
router.get('/admins', authenticateAdmin, async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('-passwordHash').sort({ createdAt: -1 });
        res.json(admins);
    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({ error: 'Failed to fetch admins' });
    }
});

// Create admin user endpoint (admin only)
router.post('/auth/create-admin', authenticateAdmin, async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Generate unique phone number for admin (since phone is required and unique)
        // Format: 9990000000 + timestamp last 6 digits to ensure uniqueness
        let uniquePhone;
        let phoneExists = true;
        while (phoneExists) {
            const timestamp = Date.now().toString().slice(-6);
            uniquePhone = `999000${timestamp}`;
            const existingPhone = await User.findOne({ phone: uniquePhone });
            if (!existingPhone) {
                phoneExists = false;
            }
        }

        // Create admin user
        const adminUser = new User({
            name,
            email: email.toLowerCase(),
            role: 'admin',
            phone: uniquePhone // Unique phone for admin
        });

        await adminUser.setPassword(password);
        await adminUser.save();

        await LogModel.create({
            level: 'info',
            source: 'admin-auth',
            message: 'admin-user-created',
            metadata: { adminId: adminUser._id, email: adminUser.email, createdBy: req.user._id }
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
        // Handle duplicate phone error
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Phone number conflict. Please try again.' });
        }
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Change admin password (admin only) - can only change own password
router.put('/admins/:id/password', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        // Only allow admins to change their own password
        if (id !== req.user._id.toString()) {
            return res.status(403).json({ error: 'You can only change your own password' });
        }

        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'User is not an admin' });
        }

        await user.setPassword(password);
        await user.save();

        await LogModel.create({
            level: 'info',
            source: 'admin-auth',
            message: 'admin-password-changed',
            metadata: { adminId: user._id, email: user.email, changedBy: req.user._id }
        });

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
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
    try {
        const p = await Payment.find().sort({ createdAt: -1 }).limit(100);
        res.json(p);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

// Get single payment by ID (admin only)
router.get('/payments/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findById(id);
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        res.json(payment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch payment' });
    }
});

router.get('/logs', authenticateAdmin, async (req, res) => {
    try {
        const q = req.query.q || '';
        const logs = await LogModel.find({ message: new RegExp(q, 'i') }).sort({ createdAt: -1 }).limit(200);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// Get single log by ID (admin only)
router.get('/logs/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const log = await LogModel.findById(id);
        if (!log) {
            return res.status(404).json({ error: 'Log not found' });
        }
        res.json(log);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch log' });
    }
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

// Analytics endpoints
router.get('/analytics/revenue', authenticateAdmin, async (req, res) => {
    try {
        const { period = '30' } = req.query; // days
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const payments = await Payment.find({
            status: 'success',
            createdAt: { $gte: startDate }
        }).sort({ createdAt: 1 });

        // Calculate daily revenue
        const dailyRevenue = {};
        payments.forEach(payment => {
            const date = payment.createdAt.toISOString().split('T')[0];
            if (!dailyRevenue[date]) {
                dailyRevenue[date] = 0;
            }
            dailyRevenue[date] += payment.amountKES || 0;
        });

        const totalRevenue = payments.reduce((sum, p) => sum + (p.amountKES || 0), 0);
        const totalTransactions = payments.length;
        const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        res.json({
            period: `${days} days`,
            totalRevenue,
            totalTransactions,
            averageTransaction: Math.round(averageTransaction * 100) / 100,
            dailyRevenue: Object.entries(dailyRevenue).map(([date, amount]) => ({ date, amount }))
        });
    } catch (error) {
        console.error('Revenue analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch revenue analytics' });
    }
});

router.get('/analytics/users', authenticateAdmin, async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const totalUsers = await User.countDocuments();
        const newUsers = await User.countDocuments({ createdAt: { $gte: startDate } });
        const verifiedUsers = await User.countDocuments({ phoneVerified: true });
        const adminUsers = await User.countDocuments({ role: 'admin' });

        // Daily user registration
        const users = await User.find({ createdAt: { $gte: startDate } }).sort({ createdAt: 1 });
        const dailyUsers = {};
        users.forEach(user => {
            const date = user.createdAt.toISOString().split('T')[0];
            dailyUsers[date] = (dailyUsers[date] || 0) + 1;
        });

        res.json({
            period: `${days} days`,
            totalUsers,
            newUsers,
            verifiedUsers,
            adminUsers,
            dailyUsers: Object.entries(dailyUsers).map(([date, count]) => ({ date, count }))
        });
    } catch (error) {
        console.error('User analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch user analytics' });
    }
});

router.get('/analytics/devices', authenticateAdmin, async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const totalDevices = await Device.countDocuments();
        const newDevices = await Device.countDocuments({ registeredAt: { $gte: startDate } });
        const activeDevices = await Device.countDocuments({
            lastSeen: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        // Daily device registrations
        const devices = await Device.find({ registeredAt: { $gte: startDate } }).sort({ registeredAt: 1 });
        const dailyDevices = {};
        devices.forEach(device => {
            const date = device.registeredAt.toISOString().split('T')[0];
            dailyDevices[date] = (dailyDevices[date] || 0) + 1;
        });

        res.json({
            period: `${days} days`,
            totalDevices,
            newDevices,
            activeDevices,
            dailyDevices: Object.entries(dailyDevices).map(([date, count]) => ({ date, count }))
        });
    } catch (error) {
        console.error('Device analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch device analytics' });
    }
});

router.get('/analytics/packages', authenticateAdmin, async (req, res) => {
    try {
        const packages = await Package.find().sort({ priceKES: 1 });
        const subscriptions = await Subscription.find().populate('userId', 'name phone');

        // Package usage statistics
        const packageStats = {};
        packages.forEach(pkg => {
            packageStats[pkg.key] = {
                name: pkg.name,
                price: pkg.priceKES,
                totalSold: 0,
                revenue: 0
            };
        });

        subscriptions.forEach(sub => {
            if (sub.packageKey && packageStats[sub.packageKey]) {
                packageStats[sub.packageKey].totalSold += 1;
                packageStats[sub.packageKey].revenue += packageStats[sub.packageKey].price;
            }
        });

        res.json({
            totalPackages: packages.length,
            packages: packages,
            packageStats: Object.values(packageStats)
        });
    } catch (error) {
        console.error('Package analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch package analytics' });
    }
});

// System stats endpoint
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalDevices = await Device.countDocuments();
        const totalSubscriptions = await Subscription.countDocuments();
        const activeSubscriptions = await Subscription.countDocuments({ active: true });
        const totalPayments = await Payment.countDocuments();
        const successfulPayments = await Payment.countDocuments({ status: 'success' });
        const totalRevenue = await Payment.aggregate([
            { $match: { status: 'success' } },
            { $group: { _id: null, total: { $sum: '$amountKES' } } }
        ]);

        const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

        res.json({
            users: {
                total: totalUsers,
                verified: await User.countDocuments({ phoneVerified: true })
            },
            devices: {
                total: totalDevices,
                active: await Device.countDocuments({
                    lastSeen: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                })
            },
            subscriptions: {
                total: totalSubscriptions,
                active: activeSubscriptions
            },
            payments: {
                total: totalPayments,
                successful: successfulPayments,
                revenue: revenue
            },
            packages: {
                total: await Package.countDocuments()
            },
            vouchers: {
                total: await Voucher.countDocuments(),
                active: await Voucher.countDocuments({ active: true })
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// System actions endpoint
router.post('/actions', authenticateAdmin, async (req, res) => {
    try {
        const { action, data } = req.body;

        switch (action) {
            case 'clear-old-logs':
                const days = data?.days || 30;
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - days);
                const result = await LogModel.deleteMany({ createdAt: { $lt: cutoffDate } });
                await LogModel.create({
                    level: 'info',
                    source: 'admin',
                    message: 'logs-cleared',
                    metadata: { deleted: result.deletedCount, days }
                });
                res.json({ success: true, message: `Cleared ${result.deletedCount} old logs` });
                break;

            case 'refresh-cache':
                // Placeholder for cache refresh
                res.json({ success: true, message: 'Cache refreshed' });
                break;

            default:
                res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('System action error:', error);
        res.status(500).json({ error: 'Failed to perform action' });
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
module.exports.authenticateAdmin = authenticateAdmin;