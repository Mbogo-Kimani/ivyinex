/**
 * Rate Limiting Middleware
 * Prevents abuse of password reset and other sensitive endpoints
 */

const rateLimit = require('express-rate-limit');

// Rate limiter for password reset requests
const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Limit each IP to 3 requests per windowMs
    message: {
        error: 'Too many password reset requests. Please try again after 15 minutes.',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
});

// Rate limiter for general auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
        error: 'Too many requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    passwordResetLimiter,
    authLimiter,
};


