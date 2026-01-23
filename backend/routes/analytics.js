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

module.exports = router;
