// src/controllers/mediaController.js
const { generateSasToken, checkFileExists } = require("../services/mediaService");
const statusCodes = require("../utils/statusCodes");

/**
 * Controller to return a secure file URL (S3 presigned)
 */
exports.redirectToBlob = async (req, res, next) => {
  try {
    const { filePath } = req.params; // this is the S3 object key

    // Check if file exists in S3
    const fileExists = await checkFileExists(filePath);
    if (!fileExists) {
      const error = new Error("File not found.");
      error.statusCode = statusCodes.NOT_FOUND;
      throw error;
    }

    // Generate presigned URL for the object
    const sasUrl = await generateSasToken(filePath);

    return res.status(statusCodes.SUCCESS).json({
      status: statusCodes.SUCCESS,
      success: true,
      message: "File URL retrieved successfully",
      data: { file_url: sasUrl },
    });
  } catch (error) {
    next(error);
  }
};
