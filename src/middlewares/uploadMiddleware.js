// src/middlewares/uploadValidationMiddleware.js
const statusCodes = require("../utils/statusCodes");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_SIZE_MB = 10;

exports.validatePresignedRequest = (req, res, next) => {
  const { fileName, fileType, fileSize } = req.query; // or req.body

  if (!fileName || !fileType) {
    return res.status(statusCodes.BAD_REQUEST).json({
      success: false,
      message: "fileName and fileType are required",
    });
  }

  if (!ALLOWED_TYPES.includes(fileType)) {
    return res.status(statusCodes.BAD_REQUEST).json({
      success: false,
      message: `File type ${fileType} is not allowed.`,
    });
  }

  if (fileSize && Number(fileSize) > MAX_SIZE_MB * 1024 * 1024) {
    return res.status(statusCodes.BAD_REQUEST).json({
      success: false,
      message: "File size exceeds limit.",
    });
  }

  next();
};
