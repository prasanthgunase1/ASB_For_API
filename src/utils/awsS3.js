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
 // src/utils/awsS3.js
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


// BOTH CODE FOR OKTA CODE SPA AND MPA
// src/utils/awsS3.js

// const { PutObjectCommand } = require("@aws-sdk/client-s3");
// const short = require("short-uuid");
// const path = require("path");
// // Ensure these are correctly exported from your config
// const { s3Client, bucketName, AWS_REGION } = require("../config/awsConfig");

// /**
//  * Uploads a file buffer directly to S3.
//  * Used for server-side processing or when Multer is required for other reasons.
//  */
// const uploadBufferToS3 = async ({ buffer, originalName, mimeType, folderPath }) => {
//   try {
//     // 1. Validation
//     if (!buffer || !buffer.length) {
//       throw new Error("Empty buffer passed to uploadBufferToS3");
//     }
//     if (!bucketName) {
//       throw new Error("S3 bucket is not configured in environment variables");
//     }

//     // 2. File Naming & Path Construction
//     const ext = path.extname(originalName || "").toLowerCase();
//     const base = path.basename(originalName || "file", ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    
//     // Generate unique ID (using short-uuid as you requested)
//     const uniqueId = short.generate();
    
//     // Construct the full S3 Key (path + filename)
//     // Example: uploads/user123/my_photo-K3d9s.jpg
//     const key = folderPath
//       ? `${folderPath}/${base}-${uniqueId}${ext}`
//       : `${base}-${uniqueId}${ext}`;

//     // 3. Prepare S3 Command
//     const command = new PutObjectCommand({
//       Bucket: bucketName,
//       Key: key,
//       Body: buffer,
//       ContentType: mimeType || "application/octet-stream",
//       // ACL: "public-read", // UNCOMMENT THIS if you want the file to be publicly readable
//     });

//     // 4. Send to AWS
//     await s3Client.send(command);

//     // 5. Construct Public URL
//     // Note: This URL works only if the object is public or bucket policy allows it
//     const blobUrl = `https://${bucketName}.s3.${AWS_REGION}.amazonaws.com/${key}`;

//     return { 
//       success: true,
//       blobName: key, 
//       blobUrl 
//     };

//   } catch (error) {
//     console.error("AWS Upload Error:", error);
//     // Re-throw or return null depending on how you want to handle it upstream
//     throw new Error(`Failed to upload to S3: ${error.message}`);
//   }
// };

// module.exports = { uploadBufferToS3 };