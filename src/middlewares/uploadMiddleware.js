const multer = require("multer");
const { MulterError } = require("multer");

const FILE_SIZE_LIMIT = Number(process.env.FILE_SIZE_LIMIT) || 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = process.env.ALLOWED_FILE_TYPES;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check mime type
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new MulterError("LIMIT_FILE_TYPE");
    error.message = `File type ${file.mimetype} is not allowed. Allowed types: pdf, ppt, pptx, txt, docx, xlsx, xls, csv, jpg, jpeg, png`;
    cb(error);
  }
};

const upload = multer({
  storage,
  limits: { 
    fileSize: FILE_SIZE_LIMIT,
    files: 1000
  },
  fileFilter
});


module.exports = upload;



// AWS Code

// require("dotenv").config({ path: `${__dirname}/../../.env` });
// const { PutObjectCommand } = require("@aws-sdk/client-s3");
// const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
// const path = require("path");
// const { s3Client } = require("../config/awsConfig");
// const statusCodes = require("../utils/statusCodes"); // Your status codes util

// const ALLOWED_FILE_TYPES = process.env.ALLOWED_FILE_TYPES 
//   ? process.env.ALLOWED_FILE_TYPES.split(",") 
//   : [];

// exports.generatePresignedUrlMiddleware = async (req, res, next) => {
//   try {
//     const { fileName, fileType } = req.body;

//     // 1. Basic Validation
//     if (!fileName || !fileType) {
//       const error = new Error("FileName and FileType are required");
//       error.statusCode = statusCodes.BAD_REQUEST; // 400
//       return next(error);
//     }

//     // 2. File Type Validation
//     if (!ALLOWED_FILE_TYPES.includes(fileType)) {
//       const error = new Error(`File type ${fileType} is not allowed.`);
//       error.statusCode = statusCodes.BAD_REQUEST; // 400
//       return next(error);
//     }

//     // 3. Prepare the AWS Key (path/filename)
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const extension = path.extname(fileName);
//     const key = `uploads/${uniqueSuffix}${extension}`;

//     // 4. Create the Command
//     const command = new PutObjectCommand({
//       Bucket: process.env.AWS_S3_BUCKET_NAME,
//       Key: key,
//       ContentType: fileType,
//     });

//     // 5. Generate URL
//     const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });

//     // 6. Attach data to request object for the controller
//     req.uploadInfo = {
//       uploadUrl: url,
//       key: key,
//       fileName: fileName
//     };

//     next(); // Proceed to the controller

//   } catch (error) {
//     next(error); // Pass to global error handler
//   }
// };