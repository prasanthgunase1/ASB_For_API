// routes/messageRoutes.js

const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
// This controller can keep its new name for clarity, or you can rename it too.
const feedbackController = require('../controllers/feedbackController'); 

// --- Health Check ---
router.get("/health/redis", feedbackController.redisHealthCheck);

// --- Operations on All Feedbacks ---
// Path restored to '/feedbacks'
router.get("/feedbacks", authMiddleware, feedbackController.getFeedbacks); 
// Path restored to '/feedbacks/all'
router.delete("/feedbacks/all", authMiddleware, feedbackController.removeAllFeedbacks); 

// --- Operations on a Specific Message's Feedback ---
// Paths restored to include '/:id/feedback'
router.get("/:id/feedback", authMiddleware, feedbackController.getFeedback);
router.patch("/:id/feedback", authMiddleware, feedbackController.updateFeedback);
router.delete("/:id/feedback", authMiddleware, feedbackController.removeFeedback);

module.exports = router;