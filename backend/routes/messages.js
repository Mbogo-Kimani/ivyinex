const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const authenticateToken = require('../middleware/auth');
const logger = require('../utils/logger');

// Get user messages (inbox)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Filter by type or status if needed
        const query = { userId: req.user.id };
        if (req.query.prop === 'unread') { // Simple filter example
            query.isRead = false;
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Message.countDocuments(query);

        res.json({
            messages,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Failed to fetch messages', { error: error.message, userId: req.user.id });
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Get unread count
router.get('/unread', authenticateToken, async (req, res) => {
    try {
        const count = await Message.countDocuments({ userId: req.user.id, isRead: false });
        res.json({ count });
    } catch (error) {
        logger.error('Failed to fetch unread count', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

// Mark message as read
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const message = await Message.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { isRead: true },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.json({ ok: true, message });
    } catch (error) {
        logger.error('Failed to mark message read', { error: error.message });
        res.status(500).json({ error: 'Failed to update message' });
    }
});

// Mark all as read
router.put('/read-all', authenticateToken, async (req, res) => {
    try {
        await Message.updateMany(
            { userId: req.user.id, isRead: false },
            { isRead: true }
        );
        res.json({ ok: true, message: 'All messages marked as read' });
    } catch (error) {
        logger.error('Failed to mark all read', { error: error.message });
        res.status(500).json({ error: 'Failed to update messages' });
    }
});

module.exports = router;
