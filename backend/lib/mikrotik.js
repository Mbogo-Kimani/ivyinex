/**
 * MikroTik RouterOS helper (node-routeros)
 * - grantAccess: will create ip-binding (bypass) for mac+ip OR create hotspot user
 * - revokeAccess: remove binding or hotspot user
 *
 * NOTE: only works if RouterOS API is enabled and the backend IP is allowed in the router firewall
 */

const { RouterOSAPI } = require('node-routeros');
const logger = require('../utils/logger');
const LogModel = require('../models/Log');

const miHost = process.env.MI_HOST || '100.122.97.19'; // Tailscale IP
const miUser = process.env.MI_API_USER || 'kim_admin';
const miPass = process.env.MI_API_PASS || '@Newkim2025.';
const miPort = Number(process.env.MI_API_PORT || 8728);
const useSSL = process.env.MI_USE_SSL === 'true';
const connectionTimeout = 15000; // 15 seconds timeout

async function withConn(fn, retries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const conn = new RouterOSAPI({
      host: miHost,
      user: miUser,
      password: miPass,
      port: miPort,
      timeout: connectionTimeout
    });

    try {
      logger.info(`MikroTik connection attempt ${attempt}/${retries}`, {
        host: miHost,
        port: miPort,
        user: miUser
      });

      await conn.connect();
      logger.info('MikroTik connected successfully', { attempt, host: miHost, port: miPort });

      const res = await fn(conn);
      await conn.close();

      logger.info('MikroTik operation completed successfully', { attempt });
      return res;

    } catch (err) {
      lastError = err;
      try {
        await conn.close();
      } catch (closeErr) {
        logger.warn('Error closing MikroTik connection', { closeErr: closeErr.message });
      }

      const isTimeout = err.message.includes('timeout') || err.message.includes('ETIMEDOUT');
      const isSocketError = err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'EHOSTUNREACH';
      const isRosException = err.name === 'RosException' || err.message.includes('RosException');

      logger.error(`MikroTik connection attempt ${attempt} failed`, {
        message: err.message,
        code: err.code,
        stack: err.stack,
        isTimeout,
        isSocketError,
        isRosException,
        host: miHost,
        port: miPort,
        errorType: isRosException ? 'RouterOS API Error' : isSocketError ? 'Network Error' : isTimeout ? 'Timeout Error' : 'Unknown Error'
      });

      await LogModel.create({
        level: 'error',
        source: 'mikrotik',
        message: `connection attempt ${attempt} failed`,
        metadata: {
          err: err.message,
          code: err.code,
          attempt,
          isTimeout,
          isSocketError,
          host: miHost,
          port: miPort
        }
      });

      // If this is the last attempt, don't wait
      if (attempt < retries) {
        const delay = Math.min(1000 * attempt, 5000); // Exponential backoff, max 5 seconds
        logger.info(`Retrying MikroTik connection in ${delay}ms`, { attempt, nextAttempt: attempt + 1 });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  logger.error('MikroTik connection failed after all retries', {
    retries,
    lastError: lastError?.message,
    host: miHost,
    port: miPort
  });

  await LogModel.create({
    level: 'error',
    source: 'mikrotik',
    message: 'connection failed after all retries',
    metadata: {
      retries,
      lastError: lastError?.message,
      host: miHost,
      port: miPort
    }
  });

  throw lastError;
}

/**
 * grantAccess options:
 * - mac: required (AA:BB:CC...)
 * - ip: optional (client ip)
 * - comment: optional
 * - until: optional ISO date string or timestamp (we store this in DB and schedule revoke)
 */
async function grantAccess({ mac, ip, comment = 'granted', until = null }) {
  if (!mac) throw new Error('mac required');
  const args = [
    `=mac-address=${mac}`
  ];
  if (ip) args.push(`=address=${ip}`);
  args.push('=type=bypassed');
  args.push(`=comment=${comment}`);

  return withConn(async (conn) => {
    // create ip-binding
    const addRes = await conn.write('/ip/hotspot/ip-binding/add', args);
    await LogModel.create({ level: 'info', source: 'mikrotik', message: 'ip-binding added', metadata: { mac, ip, addRes } });
    logger.info('MikroTik ip-binding added', { mac, ip, addRes });
    return addRes;
  });
}

async function revokeAccessByMac(mac) {
  if (!mac) throw new Error('mac required');
  return withConn(async (conn) => {
    const list = await conn.write('/ip/hotspot/ip-binding/print', [`?mac-address=${mac}`]);
    if (!list || !list[0]) return null;
    const id = list[0]['.id'];
    const removeRes = await conn.write('/ip/hotspot/ip-binding/remove', [`=.id=${id}`]);
    await LogModel.create({ level: 'info', source: 'mikrotik', message: 'ip-binding removed', metadata: { mac, id, removeRes } });
    logger.info('MikroTik ip-binding removed', { mac, id, removeRes });
    return removeRes;
  });
}

module.exports = {
  grantAccess,
  revokeAccessByMac
};
