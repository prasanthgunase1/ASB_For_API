require("dotenv").config({ path: `${__dirname}/../../.env` });
const Keycloak = require("keycloak-connect");
const statusCodes = require("../utils/statusCodes");

//Overriding keycloak access denied to return 401 status code and custom message.
Keycloak.prototype.accessDenied = (req, res, next) => {
  const error = new Error("Unauthorized/Forbidden");
  error.statusCode = statusCodes.UNAUTHORIZED;
  next(error); // Pass the error to the global error handler
};

exports.keycloak = new Keycloak(
  {},
  {
    realm: process.env.KEYCLOAK_REALM,
    bearerOnly: true,
    "auth-server-url": process.env.KEYCLOAK_URL,
    "ssl-required": "external",
    resource: process.env.KEYCLOAK_CLIENT_ID,
    credentials: {
      secret: process.env.KEYCLOAK_CLIENT_SECRET
    },
    "verify-token-audience": true,
  }
);
