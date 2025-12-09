// src/controller/fileController.js
const statusCodes = require("../utils/statusCodes");
const s3Service = require("../services/s3Service");

exports.getUploadUrl = async (req, res, next) => {
  try {
    const { fileName, fileType } = req.query;

    const data = await s3Service.generatePresignedUrl(fileName, fileType);

    return res.status(statusCodes.OK).json({
      success: true,
      message: "Upload URL generated successfully",
      data,
    });
  } catch (error) {
    console.error("Controller Error:", error);
    next(error);
  }
};
