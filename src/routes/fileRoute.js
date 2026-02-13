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

//  src/routes/fileRoutes.js
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



// BOTH CODE FOR OKTA CODE SPA AND MPA
// src/routes/fileRoute.js
// const express = require("express");
// const router = express.Router();
// const fileController = require("../controllers/fileController");

// // Import your separate middlewares
// const { protectSPA, protectMPA } = require("../middlewares/authMiddleware");

// // =========================================================
// // 1. SPA ENDPOINT (Mobile / React Native)
// //    Header: Authorization: Bearer <token>
// // =========================================================
// router.get(
//   "/spa/upload-url", 
//   protectSPA, 
//   fileController.getPresignedUrl
// );

// // =========================================================
// // 2. WEB ENDPOINT (Browser / Dashboard)
// //    Cookie: connect.sid (Automatic)
// // =========================================================
// router.get(
//   "/web/upload-url", 
//   protectMPA, 
//   fileController.getPresignedUrl
// );

// module.exports = router;