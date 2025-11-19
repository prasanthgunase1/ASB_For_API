const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const agentController = require("../controllers/agentController");

// Fallback endpoint for task status checking when WebSockets are unavailable
router.post(
  "/check-task-status",
  authMiddleware,
  agentController.checkTaskStatus
);

// Callback endpoint for LLM responses
router.post("/callback", authMiddleware, agentController.handleAgentCallback);

module.exports = router;
