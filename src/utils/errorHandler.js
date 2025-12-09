// const statusCodes = require("./statusCodes");
// const { logger } = require("./logger");

// function errorHandler(err, req, res, next) {
//   const statusCode = err.statusCode || statusCodes.INTERNAL_SERVER_ERROR;
//   const message = err.message;

//   const errorResponse = {
//     status: statusCode,
//     success: false,
//     message,
//     error: err.name === 'ValidationError' ? err.errors : {}
//   };

//   const logPayload = {
//     message: err.message,
//     stack: err.stack,
//     ...(err.name === 'ValidationError' && {
//       metadata: { validationError: err.errors }
//     })
//   };

//   logger.error(logPayload);
//   res.status(statusCode).json(errorResponse);
// }

// module.exports = errorHandler;

const statusCodes = require("./statusCodes");
const { logger } = require("./logger");
const { BaseError } = require("sequelize"); // Import Sequelize base error class

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || statusCodes.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal Server Error";
  let errors = {};

  // =========================================================
  // 1. Handle Sequelize (PostgreSQL) Errors
  // =========================================================
  if (err instanceof BaseError) {
    // Handle Unique Constraints (e.g., Duplicate Email/Username)
    if (err.name === 'SequelizeUniqueConstraintError') {
      statusCode = statusCodes.CONFLICT || 409; // 409 Conflict
      message = "Duplicate entry found.";
      errors = err.errors.map(e => ({ field: e.path, message: e.message }));
    }
    // Handle Validation Errors (e.g., allowNull violations)
    else if (err.name === 'SequelizeValidationError') {
      statusCode = statusCodes.BAD_REQUEST || 400;
      message = "Validation failed.";
      errors = err.errors.map(e => ({ field: e.path, message: e.message }));
    }
    // Handle Foreign Key Constraints (e.g., invalid persona_id)
    else if (err.name === 'SequelizeForeignKeyConstraintError') {
      statusCode = statusCodes.BAD_REQUEST || 400;
      message = "Invalid reference resource.";
    }
  }

  // =========================================================
  // 2. Handle AWS / OpenSearch Errors
  // =========================================================
  // AWS S3 "NoSuchKey" or OpenSearch "index_not_found_exception"
  if (err.name === 'NoSuchKey' || err.name === 'ResourceNotFoundException') {
    statusCode = statusCodes.NOT_FOUND || 404;
    message = "The requested resource was not found in storage.";
  }
  
  // AWS Access Denied
  if (err.Code === 'AccessDenied' || err.code === 'AccessDeniedException') {
    statusCode = statusCodes.FORBIDDEN || 403;
    message = "Access denied to storage resource.";
  }

  // =========================================================
  // 3. Handle JWT / Auth Errors (Common in Node apps)
  // =========================================================
  if (err.name === 'JsonWebTokenError') {
    statusCode = statusCodes.UNAUTHORIZED || 401;
    message = "Invalid token.";
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = statusCodes.UNAUTHORIZED || 401;
    message = "Token expired.";
  }

  // =========================================================
  // 4. Construct Response & Log
  // =========================================================
  
  const errorResponse = {
    status: statusCode,
    success: false,
    message,
    // Only show detailed error arrays if they exist
    ...(Object.keys(errors).length > 0 && { errors }),
    // 💡 Helpful for Frontend Devs: Show stack trace ONLY in Development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) 
  };

  const logPayload = {
    message: err.message,
    statusCode: statusCode, // Good to know if it was a 400 or 500
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    metadata: Object.keys(errors).length > 0 ? errors : null
  };

  // Log 500s as 'error', but 400s (bad input) as 'warn' to reduce noise
  if (statusCode >= 500) {
    logger.error(logPayload);
  } else {
    logger.warn(logPayload);
  }

  res.status(statusCode).json(errorResponse);
}

module.exports = errorHandler;