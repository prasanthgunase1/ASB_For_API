// src/routes/fileRoutes.js
const express = require("express");
const router = express.Router();

const fileController = require("../controllers/fileController");
const { validatePresignedRequest } = require("../middlewares/uploadMiddleware");
const oktaAuth = require("../middlewares/authMiddleware");

router.get(
  "/get-upload-url",
  oktaAuth.protect,          // 🔒 Okta auth
  validatePresignedRequest,  // ✅ Validate fileName/fileType/fileSize
  fileController.getUploadUrl
);

module.exports = router;
