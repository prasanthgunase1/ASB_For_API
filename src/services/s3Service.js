// src/services/s3Service.js
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client, bucketName, AWS_REGION } = require("../config/awsConfig");

const EXPIRY_SECONDS = 60 * 5; // 5 mins

exports.generatePresignedUrl = async (fileName, fileType) => {
  if (!bucketName) {
    throw new Error("S3 bucket is not configured");
  }

  if (!fileName || !fileType) {
    throw new Error("fileName and fileType are required");
  }

  const key = `uploads/${Date.now()}-${fileName}`; // you can customize folder

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: fileType,
    ServerSideEncryption: "AES256",
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: EXPIRY_SECONDS,
  });

  const fileUrl = `https://${bucketName}.s3.${AWS_REGION}.amazonaws.com/${key}`;

  return {
    uploadUrl,
    fileUrl,
    key,
    bucket: bucketName,
  };
};
