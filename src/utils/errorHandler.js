const statusCodes = require("./statusCodes");
const { logger } = require("./logger");

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || statusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message;

  const errorResponse = {
    status: statusCode,
    success: false,
    message,
    error: err.name === 'ValidationError' ? err.errors : {}
  };

  const logPayload = {
    message: err.message,
    stack: err.stack,
    ...(err.name === 'ValidationError' && {
      metadata: { validationError: err.errors }
    })
  };

  logger.error(logPayload);
  res.status(statusCode).json(errorResponse);
}

module.exports = errorHandler;
