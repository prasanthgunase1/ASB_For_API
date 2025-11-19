// routes/recommendationRoutes.js
const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { getRecommendedQuestions } = require("../controllers/recommendationController");

const router = express.Router();

router.get("/", authMiddleware, getRecommendedQuestions);

module.exports = router;  // ✅ CommonJS export
