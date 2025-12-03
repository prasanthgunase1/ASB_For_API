// const statusCodes = require("../utils/statusCodes");

// exports.sendUploadUrl = (req, res) => {
//   // The middleware has already done the work and attached 'uploadInfo'
//   const data = req.uploadInfo;

//   res.status(statusCodes.OK).json({
//     success: true,
//     message: "Presigned URL generated successfully",
//     data: data
//   });
// };