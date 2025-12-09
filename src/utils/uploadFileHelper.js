// src/utils/uploadFiles.js (or similar)
const { uploadBufferToS3 } = require("./awsS3");
const { bucketName } = require("../config/awsConfig");
const statusCodes = require("./statusCodes");

exports.uploadFiles = async (files, folderPath, options = {}) => {
  if (!folderPath) {
    const error = new Error("Missing required S3 folder path");
    error.statusCode = statusCodes.NOT_FOUND;
    throw error;
  }

  if (!files || files.length === 0) return [];

  try {
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const uploadResult = await uploadBufferToS3({
          buffer: file.buffer,
          originalName: file.originalname,
          mimeType: file.mimetype,
          folderPath,
        });

        const fileUrl = uploadResult.blobUrl;

        return {
          fileUrl,
          fileName: file.originalname || uploadResult.blobName.split("/").pop(),
          fileType: file.mimetype,
          fileSize: file.size || 0,
          fileMetadata: {
            file_path: `/${bucketName}/${uploadResult.blobName}`,
            blob_path: uploadResult.blobUrl,
            provider: "aws-s3",
          },
        };
      })
    );

    return uploadedFiles;
  } catch (error) {
    throw error;
  }
};
