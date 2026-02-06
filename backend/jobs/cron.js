const { CronJob } = require('cron');
const Payment = require('../models/Payment');
const LogModel = require('../models/Log');
const logger = require('../utils/logger');

/**
 * Job: Cleanup Pending Payments
 * Runs every 15 minutes.
 * Finds 'pending' payments older than 15 minutes and marks them as 'expired'.
 */
const cleanupPendingPaymentsJob = new CronJob(
    '*/15 * * * *', // cronTime
    async function () { // onTick
        try {
            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

            const result = await Payment.updateMany(
                {
                    status: 'pending',
                    createdAt: { $lt: fifteenMinutesAgo }
                },
                {
                    $set: {
                        status: 'expired',
                        'providerPayload.failureReason': 'Payment timed out'
                    }
                }
            );

            if (result.modifiedCount > 0) {
                logger.info(`Cleaned up ${result.modifiedCount} expired pending payments`);
                await LogModel.create({
                    level: 'info',
                    source: 'cron',
                    message: 'payments-expired',
                    metadata: { count: result.modifiedCount }
                });
            }
        } catch (error) {
            logger.error('Error cleaning up pending payments', { error: error.message });
        }
    },
    null, // onComplete
    false, // start
    'Africa/Nairobi' // timeZone
);

// Initialize Cron Jobs
const initJobs = () => {
    cleanupPendingPaymentsJob.start();
    logger.info('Pending payments cleanup job started');
};

module.exports = { initJobs, cleanupPendingPaymentsJob };
