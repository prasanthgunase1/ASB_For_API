// src/config/oktaConfig.js
const OktaJwtVerifier = require("@okta/jwt-verifier");
require("dotenv").config({ path: `${__dirname}/../../.env` });

const { OKTA_ISSUER, OKTA_AUDIENCE } = process.env;

if (!OKTA_ISSUER || !OKTA_AUDIENCE) {
  throw new Error("Missing OKTA_ISSUER or OKTA_AUDIENCE in .env");
}

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: OKTA_ISSUER, // e.g. https://dev-xxxxx.okta.com/oauth2/default
  assertClaims: {
    aud: OKTA_AUDIENCE, // e.g. api://default
  },
  cacheHandler: {
    maxAge: 60 * 60 * 1000,  // 1 hour cache
    updateAge: 10 * 60 * 1000,
  },
});

module.exports = oktaJwtVerifier;
