const service = require("../services/agentService");
const chatAiService = require("../services/chatAiService");
const statusCodes = require("../utils/statusCodes");
const { logger } = require("../utils/logger");
const { getSendResponse } = require("../services/socketService");

// --- HELPER: Set Standard API Headers ---
function setAwsJsonHeaders(res) {
  res.set({
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  });
}

/**
 * Fallback endpoint for checking task statuses when WebSockets are unavailable
 * Maintains backward compatibility while primarily supporting WebSocket architecture
 */
exports.checkTaskStatus = async (req, res, next) => {
  try {
    setAwsJsonHeaders(res);
    // logger.info("Fallback task status check endpoint called");
    const { tasks } = req.body;

    if (!Array.isArray(tasks)) {
      const error = new Error("Invalid tasks array");
      error.statusCode = statusCodes.BAD_REQUEST;
      throw error;
    }

    // Call service to check task statuses
    // Note: agentService should use the refactored repository to query Snowflake
    const results = await service.checkTaskStatuses(tasks, {
      context: { user: req.user },
    });

    // After checking statuses, attempt to send updates via WebSocket
    try {
      const sendResponse = getSendResponse();

      if (sendResponse && Array.isArray(results)) {
        for (const task of results) {
          // keys like 'status', 'task_id' rely on Service returning normalized lowercase keys
          if (task.status === "COMPLETE" && task.message_id) {
            
            // Update the task in DB (via Service)
            const taskData = await chatAiService.updateTaskStatus(
              task.task_id,
              "COMPLETE",
              task.result
            );

            if (taskData && taskData.chat_id) {
              // Send WebSocket notification
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

              logger.info(`WebSocket notification sent for fallback task: ${task.task_id}`);
            }
          }
        }
      }
    } catch (socketError) {
      logger.error("Failed to send WebSocket updates for fallback tasks:", socketError);
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
 */
exports.handleAgentCallback = async (req, res, next) => {
  try {
    setAwsJsonHeaders(res);
    const {
      chatai_message_id,
      message_type,
      answer,
      conversation_id,
      task_id,
    } = req.body;
    const files = req.files;

    logger.info(`Callback received for message ${chatai_message_id} with task_id ${task_id || "none"}`);

    const chatAIMessageData = {
      chataiMessageId: chatai_message_id,
      messageType: message_type,
      answer: answer,
    };

    // Update message in Snowflake (via Service)
    const updatedMessage = await service.updateChatAIMessage(
      chatAIMessageData,
      files,
      { context: { user: req.user } }
    );

    // Real-time WebSocket update
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

        logger.info(`WebSocket notification sent for callback: ${chatai_message_id}`);
      }

      if (task_id) {
        await chatAiService.updateTaskStatus(task_id, "COMPLETE", answer);
      }
    } catch (socketError) {
      logger.error("Failed to send WebSocket update for callback:", socketError);
    }

    res.status(statusCodes.SUCCESS).json({
      status: statusCodes.SUCCESS,
      message: "Message updated successfully",
      data: updatedMessage,
    });
  } catch (error) {
    logger.error("Error in handleAgentCallback:", error);
    next(error);
  }
};