const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit');
const logger = require('../utils/logger');

// POST /api/analytics/visit - Record a page visit
router.post('/visit', async (req, res) => {
    try {
        const { userAgent, referrer, path, deviceType } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        await Visit.create({
            ip,
            userAgent,
            referrer,
            path,
            deviceType,
            timestamp: new Date()
        });

        res.json({ ok: true });
    } catch (error) {
        // Silently fail for analytics to not block client
        logger.error('Analytics error:', { error: error.message });
        res.status(500).json({ error: 'Failed to record visit' });
    }
});

// GET /api/analytics/stats - Get analytics stats/summary
router.get('/stats', async (req, res) => {
    try {
        const totalVisits = await Visit.countDocuments();
        const uniqueVisitors = await Visit.distinct('ip').then(ips => ips.length);

        // aggregate visits by last 7 days
        const last7Days = await Visit.aggregate([
            { $match: { timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            ok: true,
            stats: {
                totalVisits,
                uniqueVisitors,
                last7Days
            }
        });
    } catch (error) {
        logger.error('Failed to get analytics stats', { error: error.message });
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

module.exports = router;
