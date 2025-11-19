const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const threadController = require("../controllers/threadController");

// Thread saving and management routes
router.post("/save-thread", authMiddleware, threadController.saveThread);
router.get(
  "/get-user-threads",
  authMiddleware,
  threadController.getUserThreads
);
router.post(
  "/rerun-thread/:workflow_id",
  authMiddleware,
  threadController.rerunThread
);

router.delete("/:workflowId", authMiddleware, threadController.deleteThread);
module.exports = router;

router.patch(
  "/:messageId/feedback",
  authMiddleware,
  threadController.addMessageFeedback
);
router.delete(
  "/:messageId/feedback",
  authMiddleware,
  threadController.deleteMessageFeedback
);
