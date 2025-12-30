const { createLogger, format, transports } = require('winston');
const path = require('path');

const logFile = process.env.LOG_FILE || path.join(__dirname, '..', 'logs', 'app.log');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: logFile }),
    new transports.Console({ format: format.combine(format.colorize(), format.simple()) })
  ],
  exitOnError: false
});

module.exports = logger;
