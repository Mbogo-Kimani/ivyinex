/**
 * Email Routes
 * Handles email marketing, unsubscribe, and email preferences
 */

const express = require('express');
const router = express.Router();
const emailMarketing = require('../lib/emailMarketing');
const { authenticateAdmin } = require('./admin');
const logger = require('../utils/logger');

// Unsubscribe from marketing emails (public)
router.get('/unsubscribe', async (req, res) => {
    try {
        const { email, token } = req.query;

        if (!email || !token) {
            return res.status(400).json({ error: 'Email and token are required' });
        }

        const result = await emailMarketing.unsubscribeUser(email, token);

        if (result.success) {
            // Return HTML page for better UX
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Unsubscribed - Wifi Mtaani</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                        .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                        h1 { color: #667eea; }
                        p { color: #666; line-height: 1.6; }
                        .success { color: #28a745; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>✓ Successfully Unsubscribed</h1>
                        <p class="success">You have been unsubscribed from marketing emails.</p>
                        <p>You will no longer receive promotional emails from Wifi Mtaani. You can still receive important account-related emails.</p>
                        <p>If you change your mind, you can resubscribe from your account settings.</p>
                    </div>
                </body>
                </html>
            `);
        } else {
            res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Error - Wifi Mtaani</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                        .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                        h1 { color: #dc3545; }
                        p { color: #666; line-height: 1.6; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Error</h1>
                        <p>${result.error || 'Invalid unsubscribe link'}</p>
                        <p>Please contact support if you need assistance.</p>
                    </div>
                </body>
                </html>
            `);
        }
    } catch (error) {
        logger.error('Unsubscribe route error', { error: error.message });
        res.status(500).json({ error: 'An error occurred' });
    }
});

// Send marketing email (admin only)
router.post('/marketing/send', authenticateAdmin, async (req, res) => {
    try {
        const { subject, title, content, ctaText, ctaLink, userIds } = req.body;

        if (!subject || !title || !content) {
            return res.status(400).json({ error: 'Subject, title, and content are required' });
        }

        const result = await emailMarketing.sendMarketingEmail({
            subject,
            title,
            content,
            ctaText,
            ctaLink,
            userIds,
        });

        res.json(result);
    } catch (error) {
        logger.error('Send marketing email error', { error: error.message });
        res.status(500).json({ error: 'Failed to send marketing email' });
    }
});

// Resubscribe user (admin only)
router.post('/marketing/resubscribe', authenticateAdmin, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const result = await emailMarketing.resubscribeUser(email);

        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        logger.error('Resubscribe error', { error: error.message });
        res.status(500).json({ error: 'Failed to resubscribe user' });
    }
});

module.exports = router;




