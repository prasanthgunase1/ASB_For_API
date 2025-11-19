const service = require("../services/agentService");
const chatAiService = require("../services/chatAiService");
const statusCodes = require("../utils/statusCodes");
const { logger } = require("../utils/logger");
const { getSendResponse } = require("../services/socketService");

/**
 * Fallback endpoint for checking task statuses when WebSockets are unavailable
 * Maintains backward compatibility while primarily supporting WebSocket architecture
 *
 * @param {Request} req - Express request object with tasks in body
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.checkTaskStatus = async (req, res, next) => {
  try {
    logger.info("Fallback task status check endpoint called");
    const { tasks } = req.body;

    if (!Array.isArray(tasks)) {
      const error = new Error("Invalid tasks array");
      error.statusCode = statusCodes.BAD_REQUEST;
      throw error;
    }

    // Call service to check task statuses
    const results = await service.checkTaskStatuses(tasks, {
      context: { user: req.user },
    });

    // After checking statuses, attempt to send updates via WebSocket
    // This allows the fallback mechanism to integrate with the WebSocket architecture
    try {
      const sendResponse = getSendResponse();

      if (sendResponse && Array.isArray(results)) {
        // Send updates for each completed task through WebSockets as well
        for (const task of results) {
          if (task.status === "COMPLETE" && task.message_id) {
            // Find message details in database
            const taskData = await chatAiService.updateTaskStatus(
              task.task_id,
              "COMPLETE",
              task.result
            );

            if (taskData && taskData.chat_id) {
              // Send WebSocket notification for this completed task
              await sendResponse(
                req.user.username || req.user.sub,
                taskData.chat_id,
                {
                  data: {
                    id: task.message_id,
                    message: task.result,
                    metadata: { status: "completed" },
                  },
                }
              );

              logger.info(
                `WebSocket notification sent for fallback task: ${task.task_id}`
              );
            }
          }
        }
      }
    } catch (socketError) {
      // Don't fail the API response if WebSocket send fails
      logger.error(
        "Failed to send WebSocket updates for fallback tasks:",
        socketError
      );
    }

    res.status(statusCodes.SUCCESS).json({
      status: statusCodes.SUCCESS,
      message: "Task statuses checked successfully",
      data: results,
    });
  } catch (error) {
    logger.error("Error in checkTaskStatus endpoint:", error);
    next(error);
  }
};

/**
 * Handles LLM callback updates and WebSocket notifications
 * Receives updated content and pushes to connected clients
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.handleAgentCallback = async (req, res, next) => {
  try {
    const {
      chatai_message_id,
      message_type,
      answer,
      conversation_id,
      task_id,
    } = req.body;
    const files = req.files;

    logger.info(
      `Callback received for message ${chatai_message_id} with task_id ${
        task_id || "none"
      }`
    );

    // Create chatAIMessageData object
    const chatAIMessageData = {
      chataiMessageId: chatai_message_id,
      messageType: message_type,
      answer: answer,
    };

    // Call the LLM service to update the chatbot message
    const updatedMessage = await service.updateChatAIMessage(
      chatAIMessageData,
      files,
      { context: { user: req.user } }
    );

    // Try to send update via WebSocket for real-time updates
    try {
      const sendResponse = getSendResponse();

      if (sendResponse && conversation_id) {
        await sendResponse(req.user.username || req.user.sub, conversation_id, {
          data: {
            id: chatai_message_id,
            message: answer,
            metadata: { status: "completed" },
          },
        });

        logger.info(
          `WebSocket notification sent for callback: ${chatai_message_id}`
        );
      }

      // Update task status if we have a task_id
      if (task_id) {
        await chatAiService.updateTaskStatus(task_id, "COMPLETE", answer);
      }
    } catch (socketError) {
      logger.error(
        "Failed to send WebSocket update for callback:",
        socketError
      );
      // Continue processing even if WebSocket send fails
    }

    // Return success response
    res.status(statusCodes.SUCCESS).json({
      status: statusCodes.SUCCESS,
      message: "Message updated successfully",
      data: updatedMessage,
    });
  } catch (error) {
    logger.error("Error in handleAgentCallback:", error);
    // Propagate the error to the centralized error handler
    next(error);
  }
};