const { createLogger, format, transports } = require('winston');
const morgan = require('morgan');

const logLevel = process.env.LOG_LEVEL || 'info';

// Winston Logger for application logs
const logger = createLogger({
  level: logLevel,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, stack, metadata }) => {
          const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : ''; // Only show if metadata exists
          return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
        })
      ),
    }),
  ],
});

// Morgan request logging using Winston
const httpLogStream = {
  write: (message) => {
    logger.info(message.trim()); // Logs HTTP requests via Winston
  },
};

morgan.format('user-http-log', (tokens, req, res) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    'content-length': tokens.res(req, res, 'content-length'),
    'response-time': `${tokens['response-time'](req, res)}ms`,
    ip: req.ip,
    message: `${tokens.method(req, res)} ${tokens.url(req, res)} ${tokens.status(req, res)}`,
  });
});

const httpLogger = morgan('user-http-log', { stream: httpLogStream });

module.exports = { logger, httpLogger };
