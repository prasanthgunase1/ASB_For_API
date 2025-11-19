const { uploadToAzure } = require("./azureBlob");
const AZURE_CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME;
const MEDIA_API_ENDPOINT = process.env.MEDIA_API_ENDPOINT;
const statusCodes = require("./statusCodes");

exports.uploadFiles = async (files, folderPath, options = {}) => {
  if (!folderPath) {
    const error = new Error("Missing required azure folder path");
    error.statusCode = statusCodes.NOT_FOUND;
    throw error; // Pass to error handler
  }
  if (!files || files.length === 0) return [];
  try {
    // Upload all files in parallel using Promise.all()
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const blobData = await uploadToAzure(file, folderPath);
        const fileUrl = blobData.blobUrl;
        return {
          fileUrl,
          fileName: file.originalname || blobData.blobName.split("/").pop(),
          fileType: file.mimetype,
          fileSize: file.size || 0, // Ensure we never return null
          fileMetadata: {
            file_path: `/${AZURE_CONTAINER_NAME}/${blobData.blobName}`,
            blob_path: blobData.blobUrl,
          },
        };
      })
    );
    return uploadedFiles;
  } catch (error) {
    throw error;
  }
};
