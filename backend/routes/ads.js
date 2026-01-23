const express = require('express');
const router = express.Router();
const Ad = require('../models/Ad');
const logger = require('../utils/logger');
const LogModel = require('../models/Log');
const { authenticateAdmin } = require('./admin');

// GET /api/ads - Get active ads (public)
router.get('/', async (req, res) => {
    try {
        const { type, category, featured, trending, popup } = req.query;
        const now = new Date();

        const query = {
            active: true,
            $and: [
                {
                    $or: [
                        { startDate: { $lte: now } },
                        { startDate: { $exists: false } }
                    ]
                },
                {
                    $or: [
                        { endDate: { $gte: now } },
                        { endDate: { $exists: false } }
                    ]
                }
            ]
        };

        if (type) query.type = type;
        if (category) query.category = category;
        if (featured === 'true') query.featured = true;
        if (trending === 'true') query.trending = true;
        if (popup === 'true') query.showAsPopup = true;

        const ads = await Ad.find(query)
            .sort({ priority: -1, createdAt: -1 })
            .select('-displaySettings.currentDisplays')
            .lean();

        res.json({ ok: true, ads });
    } catch (error) {
        logger.error('Get ads error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to fetch ads' });
    }
});

// GET /api/ads/popup - Get active pop-up ads (for WiFi users)
router.get('/popup', async (req, res) => {
    try {
        const now = new Date();
        const query = {
            active: true,
            showAsPopup: true,
            $and: [
                {
                    $or: [
                        { startDate: { $lte: now } },
                        { startDate: { $exists: false } }
                    ]
                },
                {
                    $or: [
                        { endDate: { $gte: now } },
                        { endDate: { $exists: false } }
                    ]
                }
            ]
        };

        const ads = await Ad.find(query)
            .sort({ priority: -1, createdAt: -1 })
            .limit(5) // Limit pop-up ads
            .select('-displaySettings.currentDisplays')
            .lean();

        res.json({ ok: true, ads });
    } catch (error) {
        logger.error('Get popup ads error', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch popup ads' });
    }
});

// GET /api/ads/:id - Get single ad
router.get('/:id', async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);
        if (!ad) {
            return res.status(404).json({ error: 'Ad not found' });
        }

        // Increment views
        await ad.incrementViews();

        res.json({ ok: true, ad });
    } catch (error) {
        logger.error('Get ad error', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch ad' });
    }
});

// POST /api/ads/:id/click - Track ad click
router.post('/:id/click', async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);
        if (!ad) {
            return res.status(404).json({ error: 'Ad not found' });
        }

        await ad.incrementClicks();

        res.json({ ok: true, message: 'Click tracked' });
    } catch (error) {
        logger.error('Track ad click error', { error: error.message });
        res.status(500).json({ error: 'Failed to track click' });
    }
});

// POST /api/ads/views - Bulk track ad views
router.post('/views', async (req, res) => {
    try {
        const { adIds } = req.body;
        if (!adIds || !Array.isArray(adIds) || adIds.length === 0) {
            return res.json({ ok: true, message: 'No ads to track' });
        }

        await Ad.updateMany(
            { _id: { $in: adIds } },
            { $inc: { views: 1 } }
        );

        res.json({ ok: true, message: 'Views tracked' });
    } catch (error) {
        logger.error('Track ad views error', { error: error.message });
        res.status(500).json({ error: 'Failed to track views' });
    }
});

// Admin routes - require authentication
// GET /api/ads/admin/list - Get all ads (admin)
router.get('/admin/list', authenticateAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50, active, type, category } = req.query;
        const query = {};

        if (active !== undefined) query.active = active === 'true';
        if (type) query.type = type;
        if (category) query.category = category;

        const ads = await Ad.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .populate('createdBy', 'name email')
            .lean();

        const total = await Ad.countDocuments(query);

        res.json({
            ok: true,
            ads,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        logger.error('Get admin ads error', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch ads' });
    }
});

// POST /api/ads/admin/create - Create new ad (admin)
router.post('/admin/create', authenticateAdmin, async (req, res) => {
    try {
        const {
            title,
            content,
            type,
            category,
            image,
            imageUrl,
            link,
            cta,
            featured,
            trending,
            showAsPopup,
            sendPushNotification,
            priority,
            startDate,
            endDate,
            targetAudience,
            displaySettings
        } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const ad = new Ad({
            title,
            content,
            type: type || 'promo',
            category: category || 'general',
            image,
            imageUrl,
            link,
            cta: cta || 'Learn More',
            featured: featured || false,
            trending: trending || false,
            showAsPopup: showAsPopup || false,
            sendPushNotification: sendPushNotification || false,
            priority: priority || 0,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : null,
            targetAudience: targetAudience || { all: true },
            displaySettings: displaySettings || {
                showOnHomePage: true,
                showOnAdsPage: true,
                showOnPortal: true
            },
            createdBy: req.user._id,
            active: true
        });

        await ad.save();

        await LogModel.create({
            level: 'info',
            source: 'admin-ads',
            message: 'ad-created',
            metadata: { adId: ad._id, title: ad.title, createdBy: req.user._id }
        });

        res.json({
            ok: true,
            message: 'Ad created successfully',
            ad
        });
    } catch (error) {
        logger.error('Create ad error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to create ad' });
    }
});

// PUT /api/ads/admin/:id - Update ad (admin)
router.put('/admin/:id', authenticateAdmin, async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);
        if (!ad) {
            return res.status(404).json({ error: 'Ad not found' });
        }

        const updateFields = [
            'title', 'content', 'type', 'category', 'image', 'imageUrl', 'link', 'cta',
            'featured', 'trending', 'showAsPopup', 'sendPushNotification', 'priority',
            'startDate', 'endDate', 'targetAudience', 'displaySettings', 'active'
        ];

        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                if (field === 'startDate' || field === 'endDate') {
                    ad[field] = req.body[field] ? new Date(req.body[field]) : null;
                } else {
                    ad[field] = req.body[field];
                }
            }
        });

        ad.updatedAt = new Date();
        await ad.save();

        await LogModel.create({
            level: 'info',
            source: 'admin-ads',
            message: 'ad-updated',
            metadata: { adId: ad._id, title: ad.title, updatedBy: req.user._id }
        });

        res.json({
            ok: true,
            message: 'Ad updated successfully',
            ad
        });
    } catch (error) {
        logger.error('Update ad error', { error: error.message });
        res.status(500).json({ error: 'Failed to update ad' });
    }
});

// DELETE /api/ads/admin/:id - Delete ad (admin)
router.delete('/admin/:id', authenticateAdmin, async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);
        if (!ad) {
            return res.status(404).json({ error: 'Ad not found' });
        }

        await ad.deleteOne();

        await LogModel.create({
            level: 'info',
            source: 'admin-ads',
            message: 'ad-deleted',
            metadata: { adId: ad._id, title: ad.title, deletedBy: req.user._id }
        });

        res.json({
            ok: true,
            message: 'Ad deleted successfully'
        });
    } catch (error) {
        logger.error('Delete ad error', { error: error.message });
        res.status(500).json({ error: 'Failed to delete ad' });
    }
});

// GET /api/ads/admin/stats - Get ad statistics (admin)
router.get('/admin/stats', authenticateAdmin, async (req, res) => {
    try {
        const totalAds = await Ad.countDocuments();
        const activeAds = await Ad.countDocuments({ active: true });
        const popupAds = await Ad.countDocuments({ showAsPopup: true, active: true });
        const trendingAds = await Ad.countDocuments({ trending: true, active: true });

        const totalViews = await Ad.aggregate([
            { $group: { _id: null, total: { $sum: '$views' } } }
        ]);
        const totalClicks = await Ad.aggregate([
            { $group: { _id: null, total: { $sum: '$clicks' } } }
        ]);

        res.json({
            ok: true,
            stats: {
                totalAds,
                activeAds,
                popupAds,
                trendingAds,
                totalViews: totalViews[0]?.total || 0,
                totalClicks: totalClicks[0]?.total || 0
            }
        });
    } catch (error) {
        logger.error('Get ad stats error', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

module.exports = router;
