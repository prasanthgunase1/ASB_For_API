// // src/config/awsSecrets.js

// require("dotenv").config({ path: `${__dirname}/../../.env` });

// const {
//   SecretsManagerClient,
//   GetSecretValueCommand,
// } = require("@aws-sdk/client-secrets-manager");

// const NODE_ENV = process.env.NODE_ENV || "development";
// const AWS_REGION = process.env.AWS_REGION || "us-east-2";
// const AWS_SECRET_NAME = process.env.AWS_SECRET_NAME;

// if (!AWS_SECRET_NAME) {
//   throw new Error(
//     "[awsSecrets] AWS_SECRET_NAME is not set in environment variables."
//   );
// }

// const client = new SecretsManagerClient({
//   region: AWS_REGION,
// });

// if (NODE_ENV !== "production") {
//   console.log(
//     `[awsSecrets] NODE_ENV=${NODE_ENV}, AWS_REGION=${AWS_REGION}, SECRET_ID=${AWS_SECRET_NAME}`
//   );
// }

// let cachedSecrets = null;

// async function getDBSecrets(forceRefresh = false) {
//   try {
//     if (!forceRefresh && cachedSecrets) {
//       return cachedSecrets;
//     }

//     const command = new GetSecretValueCommand({
//       SecretId: AWS_SECRET_NAME,
//     });

//     const response = await client.send(command);

//     if (!response.SecretString) {
//       throw new Error("SecretString is null or undefined.");
//     }

//     const secrets = JSON.parse(response.SecretString);

//     if (NODE_ENV !== "production") {
//       console.log(
//         "[awsSecrets] DB secrets loaded from AWS Secrets Manager (keys only):",
//         Object.keys(secrets)
//       );
//     }

//     cachedSecrets = secrets;
//     return secrets;
//   } catch (err) {
//     console.error(
//       "❌ Failed to fetch DB secrets from AWS Secrets Manager:",
//       err.message
//     );
//     throw err;
//   }
// }

// module.exports = { getDBSecrets, NODE_ENV, AWS_REGION };

// src/config/awsSecrets.js

require("dotenv").config({ path: `${__dirname}/../../.env` });

const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

const NODE_ENV = process.env.NODE_ENV || "development";
const AWS_REGION = process.env.AWS_REGION || "us-east-2";

// --- IMPORTANT: new flag for local development ---
// If false → AWS secret loading is skipped completely.
const USE_AWS_SECRETS = process.env.USE_AWS_SECRETS === "true";

// AWS secret name (only required when USE_AWS_SECRETS=true)
const AWS_SECRET_NAME = process.env.AWS_SECRET_NAME;

// -------------------------------
// ⛔ Skip AWS when working locally
// -------------------------------
if (!USE_AWS_SECRETS) {
  console.log("[awsSecrets] AWS secrets disabled (local mode). Skipping...");
  module.exports = {
    getDBSecrets: async () => {
      // Returning empty object for local DB config
      return {};
    },
    NODE_ENV,
    AWS_REGION,
  };
  return; // stop executing the rest of the file
}

// ------------------------------------------
// 🔐 Production mode – AWS secret name needed
// ------------------------------------------
if (!AWS_SECRET_NAME) {
  throw new Error(
    "[awsSecrets] AWS_SECRET_NAME is not set in environment variables."
  );
}

// AWS client initialization
const client = new SecretsManagerClient({ region: AWS_REGION });

if (NODE_ENV !== "production") {
  console.log(
    `[awsSecrets] AWS Secrets Enabled | NODE_ENV=${NODE_ENV}, REGION=${AWS_REGION}, SECRET_ID=${AWS_SECRET_NAME}`
  );
}

let cachedSecrets = null;

// Fetch AWS secrets
async function getDBSecrets(forceRefresh = false) {
  try {
    if (!forceRefresh && cachedSecrets) {
      return cachedSecrets;
    }

    const command = new GetSecretValueCommand({
      SecretId: AWS_SECRET_NAME,
    });

    const response = await client.send(command);

    if (!response.SecretString) {
      throw new Error("SecretString is null or undefined.");
    }

    const secrets = JSON.parse(response.SecretString);

    if (NODE_ENV !== "production") {
      console.log(
        "[awsSecrets] DB secrets loaded from AWS Secrets Manager (keys only):",
        Object.keys(secrets)
      );
    }

    cachedSecrets = secrets;
    return secrets;

  } catch (err) {
    console.error(
      "❌ Failed to fetch DB secrets from AWS Secrets Manager:",
      err.message
    );
    throw err;
  }
}

module.exports = { getDBSecrets, NODE_ENV, AWS_REGION };

