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
//   // Fail fast – this is required for DB connection
//   throw new Error(
//     "[awsSecrets] AWS_SECRET_NAME is not set in environment variables."
//   );
// }

// // Client uses AWS credentials from:
// // - IAM Role (recommended in prod)
// // - or AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_SESSION_TOKEN
// const client = new SecretsManagerClient({
//   region: AWS_REGION,
// });

// // Optional: region debug log (safe – no secrets)
// if (NODE_ENV !== "production") {
//   console.log(
//     `[awsSecrets] NODE_ENV=${NODE_ENV}, AWS_REGION=${AWS_REGION}, SECRET_ID=${AWS_SECRET_NAME}`
//   );
// }

// // Simple in-memory cache so we don’t hit Secrets Manager for every call
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

//     // The secret must be valid JSON: {"username": "...", "host": "...", ...}
//     const secrets = JSON.parse(response.SecretString);

//     // ✅ Security: never log full secrets (especially passwords)
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


// NEW CODE

require("dotenv").config({ path: `${__dirname}/../../.env` });
const { S3Client } = require("@aws-sdk/client-s3");

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME } = process.env;

// If using IAM Roles (e.g. on EC2/ECS), you might not need access keys here.
// But for explicit config:
if (!AWS_REGION || !S3_BUCKET_NAME) {
  throw new Error("Missing AWS_REGION or S3_BUCKET_NAME in .env");
}

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) ? {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  } : undefined, // Let SDK find credentials automatically if not provided
});

module.exports = {
  s3Client,
  bucketName: S3_BUCKET_NAME,
  AWS_REGION,
};