// // src/utils/awsS3.js
// const { PutObjectCommand } = require("@aws-sdk/client-s3");
// const short = require("short-uuid");   // ✅ correct import
// const path = require("path");
// const { s3Client, bucketName } = require("../config/awsConfig");

// const uid = short(); // ✅ not "new ShortUniqueId()"

// /**
//  * Upload a Buffer to S3 securely
//  */
// const uploadBufferToS3 = async ({ buffer, originalName, mimeType, folderPath }) => {
//   if (!buffer || !buffer.length) {
//     throw new Error("Empty buffer passed to uploadBufferToS3");
//   }

//   if (!bucketName) {
//     throw new Error("S3 bucket is not configured");
//   }

//   const ext = path.extname(originalName || "").toLowerCase();
//   const base = path
//     .basename(originalName || "file", ext)
//     .replace(/[^a-zA-Z0-9_-]/g, "_");

//   const uniqueId = uid.generate(); // ✅ correct

//   const key = folderPath
//     ? `${folderPath}/${base}-${uniqueId}${ext}`
//     : `${base}-${uniqueId}${ext}`;

//   const command = new PutObjectCommand({
//     Bucket: bucketName,
//     Key: key,
//     Body: buffer,
//     ContentType: mimeType || "application/octet-stream",
//     ServerSideEncryption: "AES256",
//   });

//   await s3Client.send(command);

//   const blobUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

//   return {
//     blobName: key,
//     blobUrl,
//   };
// };

// module.exports = { uploadBufferToS3 };

// NEW CODE
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const short = require("short-uuid"); 
const path = require("path");
const { s3Client, bucketName, AWS_REGION } = require("../config/awsConfig");

const uploadBufferToS3 = async ({ buffer, originalName, mimeType, folderPath }) => {
  if (!buffer || !buffer.length) throw new Error("Empty buffer passed to uploadBufferToS3");
  if (!bucketName) throw new Error("S3 bucket is not configured");

  const ext = path.extname(originalName || "").toLowerCase();
  const base = path.basename(originalName || "file", ext).replace(/[^a-zA-Z0-9_-]/g, "_");

  // FIX: Use short.generate() directly
  const uniqueId = short.generate(); 

  const key = folderPath
    ? `${folderPath}/${base}-${uniqueId}${ext}`
    : `${base}-${uniqueId}${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType || "application/octet-stream",
    // ServerSideEncryption: "AES256", // Optional
  });

  await s3Client.send(command);

  const blobUrl = `https://${bucketName}.s3.${AWS_REGION}.amazonaws.com/${key}`;

  return { blobName: key, blobUrl };
};

module.exports = { uploadBufferToS3 };
