/**
 * Simple cleanup job: runs every minute and removes expired ip-bindings (and marks subscription inactive)
 *
 * In production use a job queue (Bull + Redis) or a proper cron & scaling.
 */

const cron = require('cron').CronJob;
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const { revokeAccessByMac } = require('../lib/mikrotik');
const LogModel = require('../models/Log');
const logger = require('../utils/logger');

function startCleanupJob() {
  // every minute
  const job = new cron('*/1 * * * * *', async function () {
    try {
      // Check if mongoose is connected
      if (mongoose.connection.readyState !== 1) {
        logger.warn('MongoDB not connected, skipping cleanup job');
        return;
      }

      const now = new Date();
      const expired = await Subscription.find({ active: true, endAt: { $lte: now } }).maxTimeMS(5000);
      for (const s of expired) {
        if (s.mikrotikEntry && s.mikrotikEntry.mac) {
          try {
            await revokeAccessByMac(s.mikrotikEntry.mac);
          } catch (err) {
            logger.error('revokeAccess failed', { err: err.message });
            try {
              await LogModel.create({ level: 'error', source: 'cleanup', message: 'revoke-failed', metadata: { subId: s._id, err: err.message } });
            } catch (logErr) {
              logger.error('Failed to log error', { err: logErr.message });
            }
          }
        }
        s.active = false;
        await s.save();
        try {
          await LogModel.create({ level: 'info', source: 'cleanup', message: 'sub-expired', metadata: { subId: s._id } });
        } catch (logErr) {
          logger.error('Failed to log cleanup', { err: logErr.message });
        }
      }
    } catch (err) {
      logger.error('cleanup job error', { err: err.message });
      try {
        await LogModel.create({ level: 'error', source: 'cleanup', message: 'job-error', metadata: { err: err.message } });
      } catch (logErr) {
        logger.error('Failed to log job error', { err: logErr.message });
      }
    }
  }, null, true, 'Africa/Nairobi');

  job.start();
  logger.info('Cleanup job started');
}

module.exports = { startCleanupJob };
