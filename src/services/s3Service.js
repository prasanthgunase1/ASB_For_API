// // src/services/s3Service.js
// const { PutObjectCommand } = require("@aws-sdk/client-s3");
// const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
// const { s3Client, bucketName, AWS_REGION } = require("../config/awsConfig");

// const EXPIRY_SECONDS = 60 * 5; // 5 mins

// exports.generatePresignedUrl = async (fileName, fileType) => {
//   if (!bucketName) {
//     throw new Error("S3 bucket is not configured");
//   }

//   if (!fileName || !fileType) {
//     throw new Error("fileName and fileType are required");
//   }

//   const key = `uploads/${Date.now()}-${fileName}`; // you can customize folder

//   const command = new PutObjectCommand({
//     Bucket: bucketName,
//     Key: key,
//     ContentType: fileType,
//     ServerSideEncryption: "AES256",
//   });

//   const uploadUrl = await getSignedUrl(s3Client, command, {
//     expiresIn: EXPIRY_SECONDS,
//   });

//   const fileUrl = `https://${bucketName}.s3.${AWS_REGION}.amazonaws.com/${key}`;

//   return {
//     uploadUrl,
//     fileUrl,
//     key,
//     bucket: bucketName,
//   };
// };

// NEW CODE
// // src/services/s3Service.js
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client, bucketName, AWS_REGION } = require("../config/awsConfig");

const EXPIRY_SECONDS = 300; // 5 mins

exports.generatePresignedUrl = async (fileName, fileType, userId) => {
  if (!bucketName) throw new Error("S3 bucket is not configured");
  
  // Clean folder structure
  const key = `uploads/${userId || 'anonymous'}/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: EXPIRY_SECONDS });
  const fileUrl = `https://${bucketName}.s3.${AWS_REGION}.amazonaws.com/${key}`;

  return { uploadUrl, fileUrl, key, bucket: bucketName };
};


// BOTH CODE FOR OKTA CODE SPA AND MPA
// src/services/s3Service.js
// const { PutObjectCommand } = require("@aws-sdk/client-s3");
// const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
// // Ensure your awsConfig exports these correctly
// const { s3Client, bucketName, AWS_REGION } = require("../config/awsConfig");

// const EXPIRY_SECONDS = 300; // 5 mins

// exports.generatePresignedUrl = async (fileName, fileType, userId) => {
//   if (!bucketName) throw new Error("S3 bucket is not configured");
  
//   // Organized Folder Structure: uploads/USER_ID/TIMESTAMP-FILENAME
//   const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_"); // Sanitize
//   const key = `uploads/${userId}/${Date.now()}-${safeFileName}`;

//   const command = new PutObjectCommand({
//     Bucket: bucketName,
//     Key: key,
//     ContentType: fileType,
//     // ACL: 'public-read' // Uncomment if you want files public immediately
//   });

//   // Generate the "Upload Ticket"
//   const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: EXPIRY_SECONDS });
  
//   // The location where the file will live
//   const fileUrl = `https://${bucketName}.s3.${AWS_REGION}.amazonaws.com/${key}`;

//   return { uploadUrl, fileUrl, key };
// };
