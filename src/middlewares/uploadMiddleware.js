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