// // src/routes/fileRoutes.js
// const express = require("express");
// const router = express.Router();

// const fileController = require("../controllers/fileController");
// const { validatePresignedRequest } = require("../middlewares/uploadMiddleware");
// const oktaAuth = require("../middlewares/authMiddleware");

// router.get(
//   "/get-upload-url",
//   oktaAuth.protect,          // 🔒 Okta auth
//   validatePresignedRequest,  // ✅ Validate fileName/fileType/fileSize
//   fileController.getUploadUrl
// );

// module.exports = router;

// NEW CODE
const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");
const { validatePresignedRequest } = require("../middlewares/uploadMiddleware");
const oktaAuth = require("../middlewares/authMiddleware");

// GET /api/files/get-upload-url
router.get(
  "/get-upload-url",
  oktaAuth.protect,           // 1. Check Auth
  validatePresignedRequest,   // 2. Check File Params
  fileController.getUploadUrl // 3. Generate URL
);

module.exports = router;