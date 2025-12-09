// src/services/mediaService.js

require("dotenv").config({ path: `${__dirname}/../../.env` });

const {
  HeadObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const { s3Client, bucketName } = require("../config/awsConfig");
const config = require("../config/config");

const { SAS_TOKEN_EXPIRY_HOURS } = config;

const isLocal = process.env.USE_LOCAL_STORAGE === "true";

// Do not throw error if running in local mode
if (!bucketName && !isLocal) {
  throw new Error(
    "AWS S3 configuration is missing. Please set AWS_BUCKET_NAME in environment."
  );
}

/**
 * 🔍 Check file exists
 * Local → Always true
 * AWS → Real check
 */
exports.checkFileExists = async (objectKey) => {
  if (isLocal) {
    console.log("✔ Local mode: Skipping S3 check");
    return true;
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    await s3Client.send(command);
    return true;
  } catch (err) {
    if (
      err.name === "NotFound" ||
      err.$metadata?.httpStatusCode === 404
    ) {
      return false;
    }
    throw err;
  }
};

/**
 * 🔐 Generate local or AWS URL
 */
exports.generateSasToken = async (objectKey) => {
  const exists = await exports.checkFileExists(objectKey);
  if (!exists) {
    throw new Error(`File not found: ${objectKey}`);
  }

  if (isLocal) {
    console.log("✔ Local mode: Returning mock URL");
    return `http://localhost:3000/mock-files/${objectKey}`;
  }

  const hours = Number(SAS_TOKEN_EXPIRY_HOURS || 10);
  const expiresIn = hours * 60 * 60;

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });

  const signedUrl = await getSignedUrl(s3Client, command, {
    expiresIn,
  });

  return signedUrl;
};
