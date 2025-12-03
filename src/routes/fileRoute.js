// const express = require("express");
// const router = express.Router();
// const fileController = require("../controllers/fileController");
// const uploadMiddleware = require("../middleware/uploadMiddleware");
// const { keycloak } = require("../config/keycloakConfig"); // Your Auth middleware


// const oktaAuth = require("../config/oktaConfig");
// // Use oktaAuth.protect
// router.post("/upload", oktaAuth.protect, controller.upload);


// router.post(
//   "/get-upload-url",
//   keycloak.protect(),                         // 1. Auth Middleware
//   // validateMiddleware,                      // 2. (Optional) If you have a separate generic validator
//   uploadMiddleware.generatePresignedUrlMiddleware, // 3. AWS Logic Middleware
//   fileController.sendUploadUrl                // 4. Controller (Response)
// );

// module.exports = router;