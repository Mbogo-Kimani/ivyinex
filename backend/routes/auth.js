const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Device = require('../models/Device');
const logger = require('../utils/logger');
const LogModel = require('../models/Log');
const otp = require('../lib/otp');
const jwt = require('jsonwebtoken');
const emailService = require('../lib/emailService');

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

    user = new User({ name, phone: normalizedPhone, email: email?.toLowerCase().trim() });
    await user.setPassword(password);
    await user.save();

    // Add user to Brevo contact list if email provided and marketing opt-in
    if (user.email && user.emailMarketingOptIn) {
        const brevoListId = process.env.BREVO_LIST_ID ? parseInt(process.env.BREVO_LIST_ID) : null;
        emailService.addContactToBrevo(
            user.email,
            {
                FIRSTNAME: user.name || '',
                PHONE: user.phone || '',
                SMS: user.phone || '',
            },
            brevoListId ? [brevoListId] : [],
            false
        ).then(result => {
            if (result.success && result.id) {
                user.brevoContactId = result.id;
                user.save().catch(err => logger.error('Failed to save Brevo contact ID', { error: err.message }));
            }
        }).catch(err => {
            logger.error('Failed to add user to Brevo', { error: err.message, userId: user._id });
        });
    }

    // Send welcome email if email provided
    if (user.email) {
        const emailTemplates = require('../lib/emailTemplates');
        const config = emailService.getEmailConfig();
        const loginLink = `${config.frontendUrl}/auth/login`;
        
        emailService.sendEmailAsync({
            to: user.email,
            toName: user.name || user.email,
            subject: 'Welcome to Wifi Mtaani! 🎉',
            htmlContent: emailTemplates.getWelcomeTemplate(user.name || 'User', loginLink),
        });
    }

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

        // Send password changed confirmation email (async)
        if (user.email) {
            const emailTemplates = require('../lib/emailTemplates');
            
            emailService.sendEmailAsync({
                to: user.email,
                toName: user.name || user.email,
                subject: 'Password Changed Successfully - Wifi Mtaani',
                htmlContent: emailTemplates.getPasswordChangedTemplate(user.name || 'User'),
            });
        }

        res.json({ ok: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// Forgot password - send reset email
const { passwordResetLimiter } = require('../middleware/rateLimiter');
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
    try {
        const { email, phone } = req.body;
        
        // Allow reset by email or phone
        let user;
        if (email) {
            user = await User.findOne({ email: email.toLowerCase().trim() });
        } else if (phone) {
            const normalizedPhone = normalizePhoneInput(phone);
            user = await User.findOne({ phone: normalizedPhone });
        } else {
            return res.status(400).json({ error: 'Email or phone number is required' });
        }

        // Don't reveal if user exists (security best practice)
        // Always return success message to prevent user enumeration
        if (!user) {
            await LogModel.create({
                level: 'warn',
                source: 'auth',
                message: 'password-reset-requested-for-non-existent-user',
                metadata: { email, phone, ip: req.ip },
            });
            return res.json({
                ok: true,
                message: 'If an account with that email/phone exists, a password reset link has been sent.',
            });
        }

        // Check if user has email (required for password reset)
        if (!user.email) {
            return res.status(400).json({
                error: 'Email address is required for password reset. Please contact support.',
            });
        }

        // Generate reset token
        const resetToken = user.generatePasswordResetToken();
        await user.save();

        // Send reset email
        const emailTemplates = require('../lib/emailTemplates');
        const config = emailService.getEmailConfig();
        
        const resetLink = `${config.frontendUrl}/auth/reset-password?token=${resetToken}`;

        try {
            await emailService.sendEmail({
                to: user.email,
                toName: user.name || user.email,
                subject: 'Reset Your Password - Wifi Mtaani',
                htmlContent: emailTemplates.getPasswordResetTemplate(
                    user.name || 'User',
                    resetLink,
                    120 // 2 hours in minutes
                ),
            });

            await LogModel.create({
                level: 'info',
                source: 'auth',
                message: 'password-reset-email-sent',
                metadata: { userId: user._id, email: user.email },
            });

            res.json({
                ok: true,
                message: 'If an account with that email/phone exists, a password reset link has been sent.',
            });
        } catch (emailError) {
            logger.error('Failed to send password reset email', {
                userId: user._id,
                email: user.email,
                error: emailError.message,
            });

            // Clear the token if email failed
            user.clearPasswordResetToken();
            await user.save();

            return res.status(500).json({
                error: 'Failed to send password reset email. Please try again later or contact support.',
            });
        }
    } catch (error) {
        logger.error('Forgot password error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'An error occurred. Please try again later.' });
    }
});

// Reset password - validate token and update password
router.post('/reset-password', passwordResetLimiter, async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Find user with matching reset token
        const users = await User.find({
            passwordResetExpires: { $gt: Date.now() },
        });

        let user = null;
        for (const u of users) {
            const isValid = await u.verifyPasswordResetToken(token);
            if (isValid) {
                user = u;
                break;
            }
        }

        if (!user) {
            return res.status(400).json({
                error: 'Invalid or expired reset token. Please request a new password reset.',
            });
        }

        // Update password
        await user.setPassword(newPassword);
        user.clearPasswordResetToken();
        await user.save();

        // Send confirmation email
        if (user.email) {
            const emailTemplates = require('../lib/emailTemplates');
            
            emailService.sendEmailAsync({
                to: user.email,
                toName: user.name || user.email,
                subject: 'Password Changed Successfully - Wifi Mtaani',
                htmlContent: emailTemplates.getPasswordChangedTemplate(user.name || 'User'),
            });
        }

        await LogModel.create({
            level: 'info',
            source: 'auth',
            message: 'password-reset-completed',
            metadata: { userId: user._id, email: user.email },
        });

        res.json({
            ok: true,
            message: 'Password has been reset successfully. You can now log in with your new password.',
        });
    } catch (error) {
        logger.error('Reset password error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'An error occurred. Please try again later.' });
    }
});

module.exports = router;
