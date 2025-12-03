// require("dotenv").config({ path: `${__dirname}/../../.env` }); // Adjust path to root .env
// const OktaJwtVerifier = require("@okta/jwt-verifier");
// const statusCodes = require("../utils/statusCodes"); // Assuming you have this

// const oktaJwtVerifier = new OktaJwtVerifier({
//   issuer: process.env.OKTA_ISSUER, // e.g., https://dev-123456.okta.com/oauth2/default
//   clientId: process.env.OKTA_CLIENT_ID,
//   assertClaims: {
//     aud: process.env.OKTA_AUDIENCE || 'api://default',
//   },
// });

// /**
//  * Middleware to verify access token
//  * Replaces: keycloak.protect()
//  */
// const protect = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization || "";
//     const match = authHeader.match(/Bearer (.+)/);

//     if (!match) {
//       throw new Error("No Bearer token found");
//     }

//     const accessToken = match[1];

//     // Verify the token
//     const jwt = await oktaJwtVerifier.verifyAccessToken(accessToken, process.env.OKTA_AUDIENCE || 'api://default');

//     // Attach user info to request (Standardizing req.kauth structure or just req.user)
//     req.user = {
//       sub: jwt.claims.sub,
//       uid: jwt.claims.uid,
//       email: jwt.claims.sub, // Okta often uses sub as email or login
//       claims: jwt.claims
//     };

//     next();
//   } catch (err) {
//     // Custom Error handling to match your previous Keycloak accessDenied logic
//     const error = new Error("Unauthorized/Forbidden");
//     error.statusCode = statusCodes.UNAUTHORIZED || 401;
//     // Log the actual error for debugging if needed: console.error(err);
//     next(error); 
//   }
// };

// // Exporting as an object to match your import style
// module.exports = {
//   protect,
//   // If you need a raw client elsewhere, you can export oktaJwtVerifier
// };