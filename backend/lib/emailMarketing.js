/**
 * Email Marketing Utilities
 * Handles bulk emails, campaigns, and contact management
 */

const emailService = require('./emailService');
const emailTemplates = require('./emailTemplates');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Send marketing email to users who opted in
 * @param {Object} options - Email options
 * @param {string} options.subject - Email subject
 * @param {string} options.title - Email title
 * @param {string} options.content - HTML content
 * @param {string} options.ctaText - Call-to-action button text
 * @param {string} options.ctaLink - Call-to-action button link
 * @param {Array<string>} options.userIds - Specific user IDs to send to (optional)
 * @returns {Promise<Object>} - Send result
 */
async function sendMarketingEmail({ subject, title, content, ctaText, ctaLink, userIds = null }) {
    try {
        // Get users who opted in for marketing emails
        const query = {
            emailMarketingOptIn: true,
            emailBlacklisted: false,
            email: { $exists: true, $ne: '' },
        };

        if (userIds && userIds.length > 0) {
            query._id = { $in: userIds };
        }

        const users = await User.find(query).select('email name');

        if (users.length === 0) {
            return {
                success: false,
                message: 'No users found with marketing opt-in',
                sent: 0,
            };
        }

        let successCount = 0;
        let failureCount = 0;

        // Send emails asynchronously (don't block)
        const emailPromises = users.map(async (user) => {
            try {
                const unsubscribeLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(user.email)}&token=${generateUnsubscribeToken(user.email)}`;
                
                await emailService.sendEmail({
                    to: user.email,
                    toName: user.name || user.email,
                    subject,
                    htmlContent: emailTemplates.getMarketingTemplate(
                        title,
                        content,
                        ctaText,
                        ctaLink,
                        unsubscribeLink
                    ),
                });

                successCount++;
            } catch (error) {
                logger.error('Failed to send marketing email', {
                    userId: user._id,
                    email: user.email,
                    error: error.message,
                });
                failureCount++;
            }
        });

        // Wait for all emails to be sent (but don't block the response)
        Promise.all(emailPromises).catch(err => {
            logger.error('Marketing email batch error', { error: err.message });
        });

        logger.info('Marketing email campaign initiated', {
            total: users.length,
            successCount,
            failureCount,
        });

        return {
            success: true,
            message: `Marketing email campaign initiated for ${users.length} users`,
            total: users.length,
            sent: successCount,
            failed: failureCount,
        };
    } catch (error) {
        logger.error('Marketing email error', { error: error.message });
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Generate unsubscribe token (simple hash for verification)
 * @param {string} email - User email
 * @returns {string} - Unsubscribe token
 */
function generateUnsubscribeToken(email) {
    const crypto = require('crypto');
    const secret = process.env.JWT_SECRET || 'default-secret';
    return crypto.createHmac('sha256', secret).update(email).digest('hex');
}

/**
 * Verify unsubscribe token
 * @param {string} email - User email
 * @param {string} token - Unsubscribe token
 * @returns {boolean} - Whether token is valid
 */
function verifyUnsubscribeToken(email, token) {
    const crypto = require('crypto');
    const expectedToken = generateUnsubscribeToken(email);
    try {
        return crypto.timingSafeEqual(
            Buffer.from(token),
            Buffer.from(expectedToken)
        );
    } catch (error) {
        return false;
    }
}

/**
 * Unsubscribe user from marketing emails
 * @param {string} email - User email
 * @param {string} token - Unsubscribe token
 * @returns {Promise<Object>}
 */
async function unsubscribeUser(email, token) {
    try {
        // Verify token
        if (!verifyUnsubscribeToken(email, token)) {
            return {
                success: false,
                error: 'Invalid unsubscribe token',
            };
        }

        // Update user preferences
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return {
                success: false,
                error: 'User not found',
            };
        }

        user.emailMarketingOptIn = false;
        user.emailBlacklisted = true;
        await user.save();

        // Update Brevo contact
        await emailService.updateContactPreferences(email, true);

        logger.info('User unsubscribed from marketing emails', { email, userId: user._id });

        return {
            success: true,
            message: 'Successfully unsubscribed from marketing emails',
        };
    } catch (error) {
        logger.error('Unsubscribe error', { error: error.message, email });
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Resubscribe user to marketing emails
 * @param {string} email - User email
 * @returns {Promise<Object>}
 */
async function resubscribeUser(email) {
    try {
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return {
                success: false,
                error: 'User not found',
            };
        }

        user.emailMarketingOptIn = true;
        user.emailBlacklisted = false;
        await user.save();

        // Update Brevo contact
        await emailService.updateContactPreferences(email, false);

        logger.info('User resubscribed to marketing emails', { email, userId: user._id });

        return {
            success: true,
            message: 'Successfully resubscribed to marketing emails',
        };
    } catch (error) {
        logger.error('Resubscribe error', { error: error.message, email });
        return {
            success: false,
            error: error.message,
        };
    }
}

module.exports = {
    sendMarketingEmail,
    unsubscribeUser,
    resubscribeUser,
    generateUnsubscribeToken,
    verifyUnsubscribeToken,
};

