// // src/controller/fileController.js
// const statusCodes = require("../utils/statusCodes");
// const s3Service = require("../services/s3Service");

// exports.getUploadUrl = async (req, res, next) => {
//   try {
//     const { fileName, fileType } = req.query;

//     const data = await s3Service.generatePresignedUrl(fileName, fileType);

//     return res.status(statusCodes.OK).json({
//       success: true,
//       message: "Upload URL generated successfully",
//       data,
//     });
//   } catch (error) {
//     console.error("Controller Error:", error);
//     next(error);
//   }
// };

// NEW CODE 
const statusCodes = require("../utils/statusCodes");
const s3Service = require("../services/s3Service");
const { logger } = require("../utils/logger");

exports.getUploadUrl = async (req, res, next) => {
  try {
    const { fileName, fileType } = req.query;
    const userId = req.user ? req.user.userId : 'guest';

    const data = await s3Service.generatePresignedUrl(fileName, fileType, userId);

    return res.status(statusCodes.SUCCESS).json({
      success: true,
      message: "Upload URL generated successfully",
      data,
    });
  } catch (error) {
    logger.error(`Controller Error: ${error.message}`);
    next(error);
  }
};



// // src/controllers/fileController.js
// BOTH CODE FOR OKTA CODE SPA AND MPA
// const s3Service = require("../services/s3Service");

// exports.getPresignedUrl = async (req, res) => {
//   try {
//     const { fileName, fileType } = req.query;

//     // 1. Validation
//     if (!fileName || !fileType) {
//       return res.status(400).json({ message: "Missing fileName or fileType params" });
//     }

//     // 2. Get User ID (Safe fallbacks for SPA vs MPA)
//     const userId = req.user ? req.user.userId : "anonymous";

//     // 3. Generate URL
//     const data = await s3Service.generatePresignedUrl(fileName, fileType, userId);

//     // 4. Return to Client
//     return res.status(200).json({
//       success: true,
//       uploadUrl: data.uploadUrl, // Client uses this with PUT
//       fileUrl: data.fileUrl,     // Client saves this to DB
//       key: data.key              // Reference ID
//     });

//   } catch (error) {
//     console.error("S3 Presigned Error:", error);
//     return res.status(500).json({ message: "Failed to generate upload link" });
//   }
// };