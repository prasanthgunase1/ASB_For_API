// // src/config/oktaConfig.js
// const OktaJwtVerifier = require("@okta/jwt-verifier");
// require("dotenv").config({ path: `${__dirname}/../../.env` });

// const { OKTA_ISSUER, OKTA_AUDIENCE } = process.env;

// if (!OKTA_ISSUER || !OKTA_AUDIENCE) {
//   throw new Error("Missing OKTA_ISSUER or OKTA_AUDIENCE in .env");
// }

// const oktaJwtVerifier = new OktaJwtVerifier({
//   issuer: OKTA_ISSUER, // e.g. https://dev-xxxxx.okta.com/oauth2/default
//   assertClaims: {
//     aud: OKTA_AUDIENCE, // e.g. api://default
//   },
//   cacheHandler: {
//     maxAge: 60 * 60 * 1000,  // 1 hour cache
//     updateAge: 10 * 60 * 1000,
//   },
// });

// module.exports = oktaJwtVerifier;



// NEW CODE 
// const OktaJwtVerifier = require("@okta/jwt-verifier");
// require("dotenv").config({ path: `${__dirname}/../../.env` });

// const { OKTA_ISSUER, OKTA_AUDIENCE } = process.env;

// if (!OKTA_ISSUER || !OKTA_AUDIENCE) {
//   throw new Error("Missing OKTA_ISSUER or OKTA_AUDIENCE in .env");
// }

// const oktaJwtVerifier = new OktaJwtVerifier({
//   issuer: OKTA_ISSUER,
//   assertClaims: {
//     aud: OKTA_AUDIENCE,
//   },
//   cacheHandler: {
//     maxAge: 60 * 60 * 1000, // 1 hour
//     updateAge: 10 * 60 * 1000,
//   },
// });

// module.exports = oktaJwtVerifier;


// UPDATED FOR BANKING WEB (BFF) APPROACH
const { ExpressOIDC } = require("@okta/oidc-middleware");
const path = require("path");

// Ensure the path to .env is correct based on your folder structure
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const { 
    OKTA_ISSUER, 
    OKTA_CLIENT_ID, 
    OKTA_CLIENT_SECRET, 
    APP_BASE_URL 
} = process.env;

// Validation for Banking Security
if (!OKTA_ISSUER || !OKTA_CLIENT_ID || !OKTA_CLIENT_SECRET) {
    throw new Error("Missing critical Okta configuration in .env (Issuer, Client ID, or Secret)");
}

// Initialize the OIDC Middleware instead of the JWT Verifier
// This uses the "Authorization Code Flow" which is standard for Web Apps
const oidc = new ExpressOIDC({
    issuer: OKTA_ISSUER,
    client_id: OKTA_CLIENT_ID,
    client_secret: OKTA_CLIENT_SECRET, // Required for Web/Banking apps
    appBaseUrl: APP_BASE_URL || "http://localhost:5000",
    scope: "openid profile email",
    routes: {
        loginCallback: {
            path: "/authorization-code/callback" // This must match your Okta Dashboard
        }
    }
});

module.exports = oidc;