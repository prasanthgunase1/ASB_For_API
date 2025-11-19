const threadService = require("../services/threadService");
const { logger } = require("../utils/logger");
const sequelize = require("../config/database");
class ThreadController {
  /**
   * Save thread from selected messages
   * @route POST /save-thread
   */
  async saveThread(req, res) {
    try {
      const { thread_name, message_ids, user_id, chat_id, industry, persona,screen_type } = req.body;

      if (!thread_name || !message_ids || !user_id) {
        return res.status(400).json({
          success: false,
          error: "thread_name, message_ids, and user_id are required",
        });
      }

      if (!Array.isArray(message_ids) || message_ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: "message_ids must be a non-empty array",
        });
      }

      const username = req.user?.username || "system";

      // Call service to save thread
      const savedThread = await threadService.saveUserThread(
        {
          username,
          threadName: thread_name,
          messageIds: message_ids,
          userId: user_id,
          chatId: chat_id,
          industry,
          persona,
          screenType: screen_type,
        },
        { context: { user: req.user } }
      );

      return res.status(201).json({
        success: true,
        message: "Thread saved successfully",
        data: savedThread,
      });
    } catch (error) {
      logger.error("Error saving thread:", error);
      return res.status(500).json({
        success: false,
        error: "Error saving thread. Please try again.",
        details:
          process.env.NODE_ENV !== "production" ? error.message : undefined,
      });
    }
  }

  /**
   * Get user's saved threads/workflows
   * @route GET /get-user-threads
   */
  async getUserThreads(req, res) {
    try {
      const username = req.user?.username;

      if (!username) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }

      const threads = await threadService.getUserWorkflows(username);

      return res.json({
        success: true,
        data: threads,
      });
    } catch (error) {
      logger.error("Error getting user threads:", error);
      return res.status(500).json({
        success: false,
        error: "Error retrieving saved threads",
        details:
          process.env.NODE_ENV !== "production" ? error.message : undefined,
      });
    }
  }

  /**
   * Re-run thread processing
   * @route POST /rerun-thread/:workflow_id
   */
  async rerunThread(req, res) {
    try {
      const { workflow_id } = req.params;
      const { user_id } = req.body;

      if (!workflow_id || !user_id) {
        return res.status(400).json({
          success: false,
          error: "workflow_id and user_id are required",
        });
      }

      // Call service to re-run thread
      const result = await threadService.rerunWorkflow(workflow_id, user_id, {
        context: { user: req.user },
      });

      // Return both the workflow data and the run results
      return res.json({
        success: true,
        message: "Thread re-run completed",
        data: result.workflow,
        results: result.runResults,
      });
    } catch (error) {
      logger.error("Error re-running thread:", error);
      return res.status(500).json({
        success: false,
        error: "Error re-running thread",
        details:
          process.env.NODE_ENV !== "production" ? error.message : undefined,
      });
    }
  }
  
  async addMessageFeedback(req, res) {
    try {
      const { messageId } = req.params;
      const feedbackData = req.body; // e.g., { reaction: 'positive', comment: '...' }
      const username = req.user?.username;

      if (!feedbackData || !feedbackData.reaction) {
        return res.status(400).json({ success: false, error: "Feedback data is required" });
      }

      // Call a service function to handle the database update
      const updatedMessage = await threadService.addFeedbackToMessage({
        messageId,
        feedbackData,
        username
      });

      return res.status(200).json({ success: true, data: updatedMessage });
    } catch (error) {
      logger.error("Error adding feedback:", error);
      return res.status(500).json({ success: false, error: "Failed to add feedback" });
    }
  }
  async deleteMessageFeedback(req, res) {
    try {
      const { messageId } = req.params;
      const username = req.user?.username;

      if (!messageId) {
        return res.status(400).json({ success: false, error: "messageId is required" });
      }

      // Call the service function to handle feedback deletion
      await threadService.deleteMessageFeedback(messageId, username);

      return res.status(200).json({ success: true, message: "Feedback removed successfully" });
    } catch (error) {
      logger.error("Error deleting feedback:", error);
      return res.status(500).json({ success: false, error: "Failed to delete feedback" });
    }
  }


  async deleteThread(req, res) {
    try {
      const { workflowId } = req.params;
      const { userId, clientId, personaId } = req.body;

      if (!workflowId) {
        return res.status(400).json({
          success: false,
          message: "workflowId is required",
        });
      }

      // Get username from authentication context if available
      const username = req.user?.username;

      // First find the thread by ID only to avoid type conversion issues
      const thread = await sequelize.models.Workflow.findOne({
        where: {
          workflow_id: workflowId,
        },
      });

      if (!thread) {
        return res.status(404).json({
          success: false,
          message: "Thread not found",
        });
      }

      // Then check if the authenticated user is the creator
      // This avoids SQL type conversion by doing the comparison in JavaScript
      if (username && thread.created_by !== username) {
        logger.info(
          `Access denied: ${username} is not creator (${thread.created_by})`
        );
        return res.status(403).json({
          success: false,
          message: "Access denied - you are not the creator of this thread",
        });
      }

      // Check metadata permissions if specified
      const metadata = thread.metadata || {};
      console.log("Metadata:",metadata, ":clientId:",clientId, ":PersonaId:",personaId)
      if (
        (clientId && metadata.industry != clientId) ||
        (personaId && metadata.persona != personaId)
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied - insufficient permissions",
        });
      }

      // Delete the thread after all checks are passed
      await sequelize.models.Workflow.destroy({
        where: {
          workflow_id: workflowId,
        },
      });

      res.json({
        success: true,
        message: "Thread deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting thread:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to delete thread",
        details: error.message || String(error),
      });
    }
  }
}

module.exports = new ThreadController();
