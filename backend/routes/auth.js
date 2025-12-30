const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Device = require('../models/Device');
const logger = require('../utils/logger');
const LogModel = require('../models/Log');
const otp = require('../lib/otp');
const jwt = require('jsonwebtoken');

// Normalize phone input to E.164 without plus for KE (e.g. 2547XXXXXXXX)
function normalizePhoneInput(phone) {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '');
    if (digits.startsWith('0')) return '254' + digits.slice(1);
    if (digits.startsWith('254')) return digits;
    if (digits.startsWith('7')) return '254' + digits;
    if (digits.startsWith('1')) return '254' + digits;
    return digits;
}

// Register: create user entry and send OTP for phone verification
router.post('/register', async (req, res) => {
    const { name, phone, email, password, mac } = req.body;
    if (!phone || !password) return res.status(400).json({ error: 'phone and password required' });

    const normalizedPhone = normalizePhoneInput(phone);

    let user = await User.findOne({ phone: normalizedPhone });
    if (user) return res.status(400).json({ error: 'phone already registered' });

    user = new User({ name, phone: normalizedPhone, email });
    await user.setPassword(password);
    await user.save();

    // If MAC address provided, link existing device to this user
    if (mac) {
        const Device = require('../models/Device');
        const device = await Device.findOne({ mac });
        if (device && !device.userId) {
            device.userId = user._id;
            await device.save();
            await LogModel.create({
                level: 'info',
                source: 'auth',
                message: 'device-linked-during-registration',
                metadata: { phone: normalizedPhone, userId: user._id, mac, deviceId: device._id }
            });
        }
    }

    await LogModel.create({ level: 'info', source: 'auth', message: 'user-registered', metadata: { phone: normalizedPhone, userId: user._id } });
    const code = await otp.createAndSend(normalizedPhone);

    // For now, skip OTP verification and directly issue JWT (for development)
    // In production, you should require OTP verification
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY || '7d' });

    res.json({
        ok: true,
        message: 'registered successfully',
        token,
        user: { _id: user._id, phone: user.phone, name: user.name, email: user.email, freeTrialUsed: user.freeTrialUsed, createdAt: user.createdAt },
        codeSent: !!code
    });
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: 'phone and code required' });
    const normalizedPhone = normalizePhoneInput(phone);
    const ok = otp.verify(normalizedPhone, code);
    if (!ok) {
        await LogModel.create({ level: 'warn', source: 'auth', message: 'otp-failed', metadata: { phone: normalizedPhone } });
        return res.status(400).json({ error: 'invalid or expired otp' });
    }
    const user = await User.findOneAndUpdate({ phone: normalizedPhone }, { phoneVerified: true }, { new: true });
    await LogModel.create({ level: 'info', source: 'auth', message: 'otp-verified', metadata: { phone: normalizedPhone, userId: user._id } });

    // issue JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY || '7d' });
    res.json({ ok: true, token, user: { id: user._id, phone: user.phone, name: user.name } });
});

// Login
router.post('/login', async (req, res) => {
    const { phone, password } = req.body;
    const normalizedPhone = normalizePhoneInput(phone);
    const user = await User.findOne({ phone: normalizedPhone });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Wrong password' });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY || '7d' });
    res.json({ ok: true, token, user: { _id: user._id, phone: user.phone, name: user.name, email: user.email, freeTrialUsed: user.freeTrialUsed, createdAt: user.createdAt } });
});

// Get current user (protected route)
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-passwordHash');
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ ok: true, user: { _id: user._id, phone: user.phone, name: user.name, email: user.email, freeTrialUsed: user.freeTrialUsed, createdAt: user.createdAt } });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Update profile
router.put('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { name, phone, email } = req.body;
        if (name) user.name = name;
        if (phone) user.phone = normalizePhoneInput(phone);
        if (email !== undefined) user.email = email;

        await user.save();

        res.json({ ok: true, user: { _id: user._id, phone: user.phone, name: user.name, email: user.email, freeTrialUsed: user.freeTrialUsed, createdAt: user.createdAt } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Change password
router.post('/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current password and new password required' });

        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) return res.status(400).json({ error: 'Current password is incorrect' });

        await user.setPassword(newPassword);
        await user.save();

        res.json({ ok: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to change password' });
    }
});

module.exports = router;
