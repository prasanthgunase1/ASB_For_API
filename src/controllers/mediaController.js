const { generateSasToken, checkFileExists } = require("../services/mediaService");
const statusCodes = require("../utils/statusCodes");

/**
 * Controller to redirect user to a blob URL with a SAS token
 */
exports.redirectToBlob = async (req, res, next) => {
  try {
    const { filePath } = req.params;

    // Check if file exists in Azure Blob Storage
    const fileExists = await checkFileExists(filePath);
    if (!fileExists) {
      const error = new Error("File not found.");
      error.statusCode = statusCodes.NOT_FOUND;
      throw error;
    }

    // Generate SAS token for the blob
    const sasUrl = await generateSasToken(filePath);
    return res.status(statusCodes.SUCCESS).json({
      status: statusCodes.SUCCESS,
      success: true,
      message: "File URL retrieved successfully",
      data: { file_url: sasUrl },
    });
  } catch (error) {
    // Propagate the error to the centralized error handler
    next(error);
  }
};
