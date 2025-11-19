const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const mediaController = require("../controllers/mediaController");

router.get("/:filePath(*)", authMiddleware, mediaController.redirectToBlob); // (*) tells Express to capture everything (including /) in filePath.

module.exports = router;
