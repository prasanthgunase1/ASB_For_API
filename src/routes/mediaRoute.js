// src/routes/mediaRoute.js (or similar)
const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const mediaController = require("../controllers/mediaController");

router.get("/:filePath(*)", authMiddleware, mediaController.redirectToBlob);

module.exports = router;
