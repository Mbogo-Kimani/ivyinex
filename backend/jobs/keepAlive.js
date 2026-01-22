/**
 * Keep-alive job to prevent Render free tier from sleeping
 * Pings the server every 5 minutes to keep it active
 */
const axios = require('axios');
const logger = require('../utils/logger');

const KEEP_ALIVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
// Use the server's own URL for keep-alive
// On Render, use RENDER_EXTERNAL_URL, otherwise construct from PORT
const PORT = process.env.PORT || 5000;
let SERVER_URL = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL;

// If no external URL is set, use localhost (for local development)
if (!SERVER_URL) {
    SERVER_URL = `http://localhost:${PORT}`;
}

// Ensure URL doesn't have trailing slash
SERVER_URL = SERVER_URL.replace(/\/$/, '');

let keepAliveInterval = null;

function startKeepAlive() {
    if (keepAliveInterval) {
        logger.warn('Keep-alive job already running');
        return;
    }

    logger.info('Starting keep-alive job', { 
        interval: `${KEEP_ALIVE_INTERVAL / 1000}s`,
        serverUrl: SERVER_URL 
    });

    // Ping immediately
    pingServer();

    // Then ping every 5 minutes
    keepAliveInterval = setInterval(() => {
        pingServer();
    }, KEEP_ALIVE_INTERVAL);
}

function stopKeepAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
        logger.info('Keep-alive job stopped');
    }
}

async function pingServer() {
    try {
        const response = await axios.get(`${SERVER_URL}/keep-alive`, {
            timeout: 10000,
            headers: {
                'User-Agent': 'KeepAlive-Bot/1.0'
            }
        });

        if (response.data.ok) {
            logger.debug('Keep-alive ping successful', {
                uptime: response.data.uptime,
                timestamp: response.data.timestamp
            });
        }
    } catch (error) {
        logger.warn('Keep-alive ping failed', {
            error: error.message,
            url: SERVER_URL
        });
    }
}

module.exports = {
    startKeepAlive,
    stopKeepAlive
};
