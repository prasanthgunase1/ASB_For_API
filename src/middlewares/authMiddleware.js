// const { logger } = require("../utils/logger");
// const { keycloak } = require("../config/keycloak");
// const statusCodes = require("../utils/statusCodes");
// const upload = require("./uploadMiddleware");
// const { MulterError } = require("multer"); // Import MulterError

// function extractUserFromToken(req, res, next) {
//   try {
//     if (req.kauth && req.kauth.grant && req.kauth.grant.access_token) {
//       const accessToken = req.kauth.grant.access_token.content;
//       req.user = {
//         username: accessToken.preferred_username,
//         name: accessToken.name,
//         userId: accessToken.sub,
//         email: accessToken.email,
//         image_url: accessToken.picture,
//         // ... other user information
//       };
//     }
//     next();
//   } catch (error) {
//     // Instead of logging locally, pass the error to the centralized error handler
//     next(error);
//   }
// }

// function authMiddleware(req, res, next) {
//   keycloak.protect(`${process.env.KEYCLOAK_CLIENT_ID}-USER`)(req, res, (authErr) => {
//     if (authErr) return next(authErr);

//     // Only apply upload middleware to specific routes
//     if (req.params.model === "message" || req.path === "/callback") {
//       upload.array("files", 1000)(req, res, (uploadErr) => {
//         if (uploadErr) {
//           // Handle Multer-specific errors
//           if (uploadErr instanceof MulterError) {
//             uploadErr.statusCode = statusCodes.BAD_REQUEST;
//             switch (uploadErr.code) {
//               case "LIMIT_FILE_TYPE":
//                 uploadErr.message = `Invalid file type.`;
//                 break;
//               case "LIMIT_FILE_SIZE":
//                 uploadErr.message = "Max file size is 20MB";
//                 break;
//               case "LIMIT_UNEXPECTED_FILE":
//                 uploadErr.message = "Max 5 files allowed";
//                 break;
//             }
//           }
//           // Ensure error has a statusCode
//           uploadErr.statusCode = uploadErr.statusCode || statusCodes.INTERNAL_SERVER_ERROR;
//           // Pass the error to the centralized error handler
//           return next(uploadErr);
//         }
//         // No upload error - continue processing
//         next();
//       });
//     } else {
//       // Not an upload route - continue normally
//       next();
//     }
//   });
// }

// module.exports = { extractUserFromToken, authMiddleware };


// src/middlewares/oktaAuthMiddleware.js// src/middlewares/authMiddleware.js
// src/middlewares/authMiddleware.js
const oktaJwtVerifier = require("../config/oktaConfig");
const statusCodes = require("../utils/statusCodes");
const { logger } = require("../utils/logger");

/**
 * Attach req.user if token is valid.
 * If no token -> req.user = null (public / optional auth)
 */
const extractUserFromToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const accessToken = authHeader.split(" ")[1];

    const jwt = await oktaJwtVerifier.verifyAccessToken(
      accessToken,
      process.env.OKTA_AUDIENCE
    );

    req.user = {
      userId: jwt.claims.uid || jwt.claims.sub,
      email: jwt.claims.sub,
      username: jwt.claims.sub,
      name: jwt.claims.name || "",
      groups: jwt.claims.groups || [],
    };

    next();
  } catch (err) {
    logger.error(`Auth Token Invalid (extractUserFromToken): ${err.message}`);
    next(err);
  }
};

/**
 * Strict auth middleware (like keycloak.protect).
 * Route MUST have a valid Okta token.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const error = new Error("Unauthorized: Login required");
      error.statusCode = statusCodes.UNAUTHORIZED;
      return next(error);
    }

    const accessToken = authHeader.split(" ")[1];

    const jwt = await oktaJwtVerifier.verifyAccessToken(
      accessToken,
      process.env.OKTA_AUDIENCE
    );

    req.user = {
      userId: jwt.claims.uid || jwt.claims.sub,
      email: jwt.claims.sub,
      username: jwt.claims.sub,
      name: jwt.claims.name || "",
      groups: jwt.claims.groups || [],
    };

    next();
  } catch (err) {
    logger.error(`Auth Token Invalid (protect): ${err.message}`);
    const error = new Error("Unauthorized: Invalid Token");
    error.statusCode = statusCodes.UNAUTHORIZED;
    next(error);
  }
};

/**
 * Backward-compatible alias:
 * Some routes may already be using `authMiddleware`.
 * It behaves exactly like `protect`.
 */
const authMiddleware = (req, res, next) => {
  return protect(req, res, next);
};

module.exports = {
  extractUserFromToken,
  authMiddleware,
  protect,          // so `oktaAuth.protect` works in fileRoutes
};
