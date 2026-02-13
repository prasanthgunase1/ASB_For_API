// // src/middlewares/authMiddleware.js
// const statusCodes = require("../utils/statusCodes");
// const { logger } = require("../utils/logger");

// const AUTH_BYPASS =
//   String(process.env.AUTH_BYPASS || "").toLowerCase() === "true";

// // ✅ Safe mapper (no Okta -> no crash)
// const extractUserFromToken = (req, _res, next) => {
//   try {
//     // ✅ DEV bypass
//     if (AUTH_BYPASS) {
//       req.user = {
//         userId: "dev-user",
//         email: "developer@example.com",
//         name: "Developer",
//         groups: [],
//       };
//       return next();
//     }

//     // ✅ Okta user (safe optional chaining)
//     const userInfo = req.userContext?.userinfo;
//     if (userInfo) {
//       req.user = {
//         userId: userInfo.sub,
//         email: userInfo.email,
//         name: userInfo.name || "",
//         groups: userInfo.groups || [],
//       };
//     } else {
//       req.user = null; // guest
//     }

//     return next();
//   } catch (err) {
//     logger.error("extractUserFromToken error:", err);
//     req.user = null;
//     return next();
//   }
// };

// const protect = (req, _res, next) => {
//   // ✅ DEV bypass
//   if (AUTH_BYPASS) {
//     req.user =
//       req.user ||
//       {
//         userId: "dev-user",
//         email: "developer@example.com",
//         name: "Developer",
//         groups: [],
//       };
//     return next();
//   }

//   // ✅ Okta auth (safe optional chaining)
//   if (req.isAuthenticated?.() && req.userContext?.userinfo) {
//     const userInfo = req.userContext.userinfo;
//     req.user = {
//       userId: userInfo.sub,
//       email: userInfo.email,
//       name: userInfo.name || "",
//       groups: userInfo.groups || [],
//     };
//     return next();
//   }

//   logger.error(`Strict Auth Failed: No active banking session for ${req.originalUrl}`);
//   const error = new Error("Unauthorized: Secure banking session required");
//   error.statusCode = statusCodes.UNAUTHORIZED;
//   return next(error);
// };

// module.exports = {
//   extractUserFromToken,
//   protect,
//   authMiddleware: protect,
// };


// UPDATED FOR BANKING WEB (BFF) APPROACH
const statusCodes = require("../utils/statusCodes");
const { logger } = require("../utils/logger");


const extractUserFromToken = (req, res, next) => {
  // Check if Okta middleware has authenticated the session
  if (req.userContext && req.userContext.userinfo) {
    const userInfo = req.userContext.userinfo;
    
    req.user = {
      userId: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name || "",
      groups: userInfo.groups || [],
    };
  } else {
    req.user = null; // Treat as guest
  }
  next();
};

/**
 * STRICT AUTH: Blocks the request if no valid session cookie is found.
 * Standard for banking operations (like file uploads).
 */
const protect = (req, res, next) => {
  // req.isAuthenticated() is provided by @okta/oidc-middleware
  if (req.isAuthenticated && req.isAuthenticated()) {
    const userInfo = req.userContext.userinfo;
    
    req.user = {
      userId: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name || "",
      groups: userInfo.groups || [],
    };
    return next();
  }

  // If not authenticated, return a 401
  logger.error(`Strict Auth Failed: No active banking session for ${req.originalUrl}`);
  
  const error = new Error("Unauthorized: Secure banking session required");
  error.statusCode = statusCodes.UNAUTHORIZED;
  return next(error);
};

module.exports = { 
  extractUserFromToken, 
  protect, 
  authMiddleware: protect 
};


// BOTH CODE FOR OKTA CODE SPA AND MPA
// src/middlewares/authMiddleware.js
const { spaVerifier } = require("../config/oktaConfig"); // Import the new verifier
const statusCodes = require("../utils/statusCodes"); // Assuming you have this
const { logger } = require("../utils/logger");       // Assuming you have this

// =========================================================
// A. SPA PROTECTION (Bearer Token)
// =========================================================
const protectSPA = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const match = authHeader.match(/Bearer (.+)/);

    if (!match) {
      return res.status(401).json({ message: "SPA Unauthorized: Bearer token required" });
    }

    const accessToken = match[1];

    // Verify the token using the new spaVerifier
    const jwt = await spaVerifier.verifyAccessToken(accessToken, 'api://default');
    
    // Attach User to Request
    req.user = {
      userId: jwt.claims.sub,
      email: jwt.claims.sub, // 'sub' is usually email/ID in Okta access tokens
      groups: jwt.claims.groups || [],
      authType: 'SPA'
    };

    return next();

  } catch (err) {
    console.error(`SPA Auth Error: ${err.message}`);
    return res.status(401).json({ message: "Invalid or Expired Token" });
  }
};

// =========================================================
// B. MPA PROTECTION (Session Cookie)
// =========================================================
const protectMPA = (req, res, next) => {
  // Check if session exists (provided by oidc middleware)
  if (req.isAuthenticated && req.isAuthenticated()) {
    
    const userInfo = req.userContext.userinfo;
    
    req.user = {
      userId: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name || "",
      groups: userInfo.groups || [],
      authType: 'MPA'
    };
    
    return next();
  }

  // If not logged in:
  console.warn(`MPA Auth Failed: No session for ${req.originalUrl}`);

  // If strict API call, fail
  return res.status(401).json({ message: "Not Authenticated" });
};

module.exports = { protectSPA, protectMPA };