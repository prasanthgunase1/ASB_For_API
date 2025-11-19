// utils/statusCodes.js

module.exports = {
    // Success Codes
    SUCCESS: 200,
    CREATED: 201,
    NO_CONTENT: 204,

    // Redirection codes
    FOUND: 302,

    // Client Error Codes
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    VALIDATION_ERROR: 422,
  
    // Server Error Codes
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  };