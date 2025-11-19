const { logger } = require("../utils/logger");
const { keycloak } = require("../config/keycloak");
const statusCodes = require("../utils/statusCodes");
const upload = require("./uploadMiddleware");
const { MulterError } = require("multer"); // Import MulterError

function extractUserFromToken(req, res, next) {
  try {
    if (req.kauth && req.kauth.grant && req.kauth.grant.access_token) {
      const accessToken = req.kauth.grant.access_token.content;
      req.user = {
        username: accessToken.preferred_username,
        name: accessToken.name,
        userId: accessToken.sub,
        email: accessToken.email,
        image_url: accessToken.picture,
        // ... other user information
      };
    }
    next();
  } catch (error) {
    // Instead of logging locally, pass the error to the centralized error handler
    next(error);
  }
}

function authMiddleware(req, res, next) {
  keycloak.protect(`${process.env.KEYCLOAK_CLIENT_ID}-USER`)(req, res, (authErr) => {
    if (authErr) return next(authErr);

    // Only apply upload middleware to specific routes
    if (req.params.model === "message" || req.path === "/callback") {
      upload.array("files", 1000)(req, res, (uploadErr) => {
        if (uploadErr) {
          // Handle Multer-specific errors
          if (uploadErr instanceof MulterError) {
            uploadErr.statusCode = statusCodes.BAD_REQUEST;
            switch (uploadErr.code) {
              case "LIMIT_FILE_TYPE":
                uploadErr.message = `Invalid file type.`;
                break;
              case "LIMIT_FILE_SIZE":
                uploadErr.message = "Max file size is 20MB";
                break;
              case "LIMIT_UNEXPECTED_FILE":
                uploadErr.message = "Max 5 files allowed";
                break;
            }
          }
          // Ensure error has a statusCode
          uploadErr.statusCode = uploadErr.statusCode || statusCodes.INTERNAL_SERVER_ERROR;
          // Pass the error to the centralized error handler
          return next(uploadErr);
        }
        // No upload error - continue processing
        next();
      });
    } else {
      // Not an upload route - continue normally
      next();
    }
  });
}

module.exports = { extractUserFromToken, authMiddleware };
