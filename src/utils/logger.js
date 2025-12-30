// const { createLogger, format, transports } = require('winston');
// const morgan = require('morgan');

// const logLevel = process.env.LOG_LEVEL || 'info';

// // Winston Logger for application logs
// const logger = createLogger({
//   level: logLevel,
//   format: format.combine(
//     format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
//     format.json()
//   ),
//   transports: [
//     new transports.Console({
//       format: format.combine(
//         format.colorize(),
//         format.printf(({ timestamp, level, message, stack, metadata }) => {
//           const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : ''; // Only show if metadata exists
//           return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
//         })
//       ),
//     }),
//   ],
// });

// // Morgan request logging using Winston
// const httpLogStream = {
//   write: (message) => {
//     logger.info(message.trim()); // Logs HTTP requests via Winston
//   },
// };

// morgan.format('user-http-log', (tokens, req, res) => {
//   return JSON.stringify({
//     timestamp: new Date().toISOString(),
//     method: tokens.method(req, res),
//     url: tokens.url(req, res),
//     status: tokens.status(req, res),
//     'content-length': tokens.res(req, res, 'content-length'),
//     'response-time': `${tokens['response-time'](req, res)}ms`,
//     ip: req.ip,
//     message: `${tokens.method(req, res)} ${tokens.url(req, res)} ${tokens.status(req, res)}`,
//   });
// });

// const httpLogger = morgan('user-http-log', { stream: httpLogStream });

// module.exports = { logger, httpLogger };


// NEW CODE 
const { createLogger, format, transports } = require('winston');
const morgan = require('morgan');

const logLevel = process.env.LOG_LEVEL || 'info';

// 1. Configure Winston Logger
const logger = createLogger({
  level: logLevel,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }), // Ensure error stacks are captured
    format.json() // Keeps logs structured for files/production tools
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        // FIX: We use '...meta' to capture ALL extra properties passed to the logger
        format.printf(({ timestamp, level, message, stack, ...meta }) => {
          // If there is extra data (meta), stringify it so it shows up in the console
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
        })
      ),
    }),
  ],
});

// 2. Configure Morgan to output a JSON string
morgan.format('user-http-log', (tokens, req, res) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: Number(tokens.status(req, res)),
    content_length: tokens.res(req, res, 'content-length'),
    response_time: `${tokens['response-time'](req, res)}ms`,
    ip: req.ip || req.connection.remoteAddress,
    message: `${tokens.method(req, res)} ${tokens.url(req, res)} ${tokens.status(req, res)}`,

  });
});

// 3. Connect Morgan to Winston
const httpLogStream = {
  write: (message) => {
    // We use 'http' level for network requests so they are easy to filter
    logger.http(message.trim());
  },
};

const httpLogger = morgan('user-http-log', { stream: httpLogStream });

module.exports = { logger, httpLogger };