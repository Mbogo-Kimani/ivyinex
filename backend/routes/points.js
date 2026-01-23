const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Points = require('../models/Points');
const Package = require('../models/PackageModel');
const LogModel = require('../models/Log');
const logger = require('../utils/logger');

// Middleware to verify JWT token
const authenticateToken = require('../middleware/auth');

/**
 * GET /api/points/balance
 * Get user's current points balance
 */
router.get('/balance', authenticateToken, async (req, res) => {
    try {
        let user = await User.findById(req.user.id);

        // Auto-generate referral code if missing (fix for existing users)
        if (!user.referralCode) {
            let referralCode;
            let isUnique = false;
            let attempts = 0;

            while (!isUnique && attempts < 5) {
                referralCode = user.generateReferralCode();
                const existing = await User.findOne({ referralCode });
                if (!existing) {
                    isUnique = true;
                }
                attempts++;
            }

            if (isUnique) {
                user.referralCode = referralCode;
                await user.save();
            }
        }

        res.json({
            points: user.points,
            referralCode: user.referralCode
        });
    } catch (err) {
        logger.error('Failed to get points balance', { error: err.message });
        res.status(500).json({ error: 'Failed to get points balance' });
    }
});

/**
 * GET /api/points/history
 * Get user's points transaction history
 */
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const transactions = await Points.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(transactions);
    } catch (err) {
        logger.error('Failed to get points history', { error: err.message });
        res.status(500).json({ error: 'Failed to get points history' });
    }
});

/**
 * POST /api/points/use
 * Use points to purchase a package
 */
router.post('/use', authenticateToken, async (req, res) => {
    try {
        const { packageKey, mac, ip } = req.body;

        if (!packageKey) {
            return res.status(400).json({ error: 'Package key is required' });
        }

        // Get package details
        const pkg = await Package.findOne({ key: packageKey });
        if (!pkg) {
            return res.status(404).json({ error: 'Package not found' });
        }

        // Check if package can be purchased with points
        if (pkg.pointsRequired <= 0) {
            return res.status(400).json({ error: 'This package cannot be purchased with points' });
        }

        // Get user and check points balance
        const user = await User.findById(req.user.id);
        if (user.points < pkg.pointsRequired) {
            return res.status(400).json({
                error: 'Insufficient points',
                required: pkg.pointsRequired,
                available: user.points
            });
        }

        // Deduct points
        await user.deductPoints(pkg.pointsRequired);

        // Create points transaction record
        await Points.create({
            userId: user._id,
            amount: -pkg.pointsRequired,
            type: 'redemption',
            description: `Used ${pkg.pointsRequired} points to purchase ${pkg.name}`,
            relatedPackage: packageKey
        });

        // Log the transaction
        await LogModel.create({
            level: 'info',
            source: 'points',
            message: 'points-redemption',
            metadata: {
                userId: user._id,
                packageKey,
                pointsUsed: pkg.pointsRequired
            }
        });

        res.json({
            success: true,
            message: 'Package purchased with points',
            remainingPoints: user.points,
            package: pkg
        });

    } catch (err) {
        logger.error('Failed to use points', { error: err.message });
        res.status(500).json({ error: err.message || 'Failed to use points' });
    }
});

/**
 * POST /api/points/referral
 * Process referral and award points
 */
router.post('/referral', async (req, res) => {
    try {
        const { referralCode, newUserId } = req.body;

        if (!referralCode || !newUserId) {
            return res.status(400).json({ error: 'Referral code and user ID are required' });
        }

        // Find referrer
        const referrer = await User.findOne({ referralCode });
        if (!referrer) {
            return res.status(404).json({ error: 'Invalid referral code' });
        }

        // Check if user was already referred
        const newUser = await User.findById(newUserId);
        if (newUser.referredBy) {
            return res.status(400).json({ error: 'User was already referred' });
        }

        // Award referral points (e.g., 50 points for each referral)
        const referralPoints = 50;
        await referrer.addPoints(referralPoints, 'referral');

        // Update new user's referral info
        newUser.referredBy = referrer._id;
        await newUser.save();

        // Create points transaction records
        await Points.create({
            userId: referrer._id,
            amount: referralPoints,
            type: 'referral',
            description: `Earned ${referralPoints} points for referring ${newUser.phone}`,
            relatedUser: newUser._id
        });

        // Award bonus points to new user
        const bonusPoints = 25;
        await newUser.addPoints(bonusPoints, 'referral_bonus');

        await Points.create({
            userId: newUser._id,
            amount: bonusPoints,
            type: 'bonus',
            description: `Welcome bonus for using referral code`,
            relatedUser: referrer._id
        });

        await LogModel.create({
            level: 'info',
            source: 'points',
            message: 'referral-processed',
            metadata: {
                referrerId: referrer._id,
                newUserId: newUser._id,
                referralCode
            }
        });

        res.json({
            success: true,
            message: 'Referral processed successfully',
            referrerPoints: referrer.points,
            newUserPoints: newUser.points
        });

    } catch (err) {
        logger.error('Failed to process referral', { error: err.message });
        res.status(500).json({ error: err.message || 'Failed to process referral' });
    }
});

/**
 * GET /api/points/referral-code
 * Get user's referral code
 */
router.get('/referral-code', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        // Generate referral code if user doesn't have one
        if (!user.referralCode) {
            let referralCode;
            let isUnique = false;

            while (!isUnique) {
                referralCode = user.generateReferralCode();
                const existing = await User.findOne({ referralCode });
                if (!existing) {
                    isUnique = true;
                }
            }

            user.referralCode = referralCode;
            await user.save();
        }

        res.json({ referralCode: user.referralCode });
    } catch (err) {
        logger.error('Failed to get referral code', { error: err.message });
        res.status(500).json({ error: 'Failed to get referral code' });
    }
});

module.exports = router;














