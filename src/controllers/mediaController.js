// // src/controllers/mediaController.js
// const { generateSasToken, checkFileExists } = require("../services/mediaService");
// const statusCodes = require("../utils/statusCodes");

// /**
//  * Controller to return a secure file URL (S3 presigned)
//  */
// exports.redirectToBlob = async (req, res, next) => {
//   try {
//     const { filePath } = req.params; // this is the S3 object key

//     // Check if file exists in S3
//     const fileExists = await checkFileExists(filePath);
//     if (!fileExists) {
//       const error = new Error("File not found.");
//       error.statusCode = statusCodes.NOT_FOUND;
//       throw error;
//     }

//     // Generate presigned URL for the object
//     const sasUrl = await generateSasToken(filePath);

//     return res.status(statusCodes.SUCCESS).json({
//       status: statusCodes.SUCCESS,
//       success: true,
//       message: "File URL retrieved successfully",
//       data: { file_url: sasUrl },
//     });
//   } catch (error) {
//     next(error);
//   }
// };


// new code

const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const { HeadObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// Import the client and the bucket name from our fixed config
const { s3Client, bucketName } = require("../config/awsConfig");
const config = require("../config/config");

const { SAS_TOKEN_EXPIRY_HOURS } = config;
const isLocal = process.env.USE_LOCAL_STORAGE === "true";

// Do not throw error if running in local mode
if (!bucketName && !isLocal) {
  throw new Error("AWS S3 configuration is missing. Please set AWS_S3_BUCKET_NAME in environment.");
}

/**
 * 🔍 Check file exists
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
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw err;
  }
};

/**
 * 🔐 Generate local or AWS URL
 */
exports.generateSasToken = async (objectKey) => {
  // Optimization: Only check existence if you really need to prevent 404 links.
  // Otherwise, you can remove this check to speed up the response.
  const exists = await exports.checkFileExists(objectKey);
  if (!exists) {
    throw new Error(`File not found: ${objectKey}`);
  }

  if (isLocal) {
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