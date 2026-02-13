// // src/config/awsSecrets.js

// require("dotenv").config({ path: `${__dirname}/../../.env` });

// const {
//   SecretsManagerClient,
//   GetSecretValueCommand,
// } = require("@aws-sdk/client-secrets-manager");

// // -----------------------------
// // Required env vars (prod only)
// // -----------------------------
// const NODE_ENV = process.env.NODE_ENV || "production";
// const AWS_REGION = process.env.AWS_REGION;
// const AWS_SECRET_NAME = process.env.AWS_SECRET_NAME;

// if (!AWS_REGION) {
//   throw new Error("[awsSecrets] AWS_REGION is not set in environment variables.");
// }

// if (!AWS_SECRET_NAME) {
//   throw new Error("[awsSecrets] AWS_SECRET_NAME is not set in environment variables.");
// }

// // -----------------------------
// // AWS Secrets Manager client
// // -----------------------------
// const client = new SecretsManagerClient({ region: AWS_REGION });

// // In-memory cache – avoids hitting Secrets Manager on every request
// let cachedSecrets = null;

// /**
//  * Fetches DB credentials JSON from AWS Secrets Manager and parses it.
//  * Always used in production (no local fallback).
//  *
//  * Secret must be JSON like:
//  * {
//  *   "username": "db_user",
//  *   "password": "db_pass",
//  *   "host": "your-rds-host.rds.amazonaws.com",
//  *   "port": 5432,
//  *   "dbname": "your_db_name"
//  * }
//  *
//  * @param {boolean} [forceRefresh=false] - bypass local cache if true
//  * @returns {Promise<object>} parsed secrets object
//  */
// async function getDBSecrets(forceRefresh = false) {
//   if (!forceRefresh && cachedSecrets) {
//     return cachedSecrets;
//   }

//   try {
//     const command = new GetSecretValueCommand({
//       SecretId: AWS_SECRET_NAME,
//     });

//     const response = await client.send(command);

//     if (!response || !response.SecretString) {
//       throw new Error("SecretString is null or undefined.");
//     }

//     const secrets = JSON.parse(response.SecretString);

//     // Basic validation – make sure important keys exist
//     const requiredKeys = ["username", "password", "host", "dbname"];
//     const missing = requiredKeys.filter((k) => !secrets[k]);

//     if (missing.length) {
//       throw new Error(
//         `[awsSecrets] Secret is missing required keys: ${missing.join(", ")}`
//       );
//     }

//     // ✅ Security: never log secret values
//     if (NODE_ENV !== "production") {
//       console.log(
//         "[awsSecrets] DB secrets loaded from AWS Secrets Manager (keys only):",
//         Object.keys(secrets)
//       );
//     }

//     cachedSecrets = secrets;
//     return secrets;
//   } catch (err) {
//     console.error("❌ Failed to fetch DB secrets from AWS Secrets Manager:", err.message);
//     throw err;
//   }
// }

// module.exports = {
//   getDBSecrets,
//   NODE_ENV,
//   AWS_REGION,
// };

// //POSTGRES NEW CODE 
// require("dotenv").config({ path: `${__dirname}/../../.env` });
// const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
// const { logger } = require("../utils/logger");

// const NODE_ENV = process.env.NODE_ENV || "development";
// const AWS_REGION = process.env.AWS_REGION || "us-east-1";
// const AWS_SECRET_NAME = process.env.AWS_SECRET_NAME;

// if (!AWS_SECRET_NAME) {
//   throw new Error("[awsSecrets] AWS_SECRET_NAME is not set in environment variables.");
// }

// const client = new SecretsManagerClient({ region: AWS_REGION });
// let cachedSecrets = null;

// async function getDBSecrets(forceRefresh = false) {
//   if (!forceRefresh && cachedSecrets) return cachedSecrets;

//   try {
//     logger.info(`[awsSecrets] Fetching secret: ${AWS_SECRET_NAME} in ${AWS_REGION}`);
//     const command = new GetSecretValueCommand({ SecretId: AWS_SECRET_NAME });
//     const response = await client.send(command);

//     if (!response || !response.SecretString) {
//       throw new Error("SecretString is null or undefined.");
//     }

//     const secrets = JSON.parse(response.SecretString);
//     const requiredKeys = ["username", "password", "host", "dbname"];
//     const missing = requiredKeys.filter((k) => !secrets[k]);

//     if (missing.length) {
//       throw new Error(`[awsSecrets] Secret is missing required keys: ${missing.join(", ")}`);
//     }

//     if (NODE_ENV !== "production") {
//       logger.info(`[awsSecrets] DB secrets loaded. Keys: ${Object.keys(secrets).join(", ")}`);
//     }

//     cachedSecrets = secrets;
//     return secrets;
//   } catch (err) {
//     logger.error(`[awsSecrets] Failed to fetch secrets: ${err.message}`);
//     throw err;
//   }
// }

// module.exports = { getDBSecrets, NODE_ENV, AWS_REGION };

// SNOWFLAKE CODE
require("dotenv").config({ path: `${__dirname}/../../.env` });
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

let cache = null;

async function getSnowflakeSecret() {
  if (cache) return cache;

  const region = process.env.AWS_REGION || "us-east-2";
  const secretId = process.env.SNOWFLAKE_SECRET_NAME;

  if (!secretId) {
    throw new Error("SNOWFLAKE_SECRET_NAME is missing in env");
  }

  const client = new SecretsManagerClient({ region });
  const cmd = new GetSecretValueCommand({ SecretId: secretId });

  const resp = await client.send(cmd);

  if (!resp || !resp.SecretString) {
    throw new Error("SecretString is empty from AWS Secrets Manager");
  }

  cache = JSON.parse(resp.SecretString);
  return cache;
}

module.exports = { getSnowflakeSecret };
