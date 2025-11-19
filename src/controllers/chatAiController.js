const service = require("../services/chatAiService");
const statusCodes = require("../utils/statusCodes");

exports.addMessage = async (req, res, next) => {
  try {
    const {
      conversation_id,
      source_msg_id,
      message,
      sender_type,
      feedback_reaction,
      message_type,
      metadata,
      currentPage,
    } = req.body;
    const files = req.files; // Files uploaded using multer
    const llmPayload = JSON.parse(req.body.llmPayload);

    // Get WebSocket instances from app
    //const { io, sendResponse } = req.app.get("socket");

    // Validate sender_type
    if (sender_type === "chatai") {
      const error = new Error(
        "sender_type cannot be 'chatai' for user messages"
      );
      error.statusCode = statusCodes.BAD_REQUEST;
      throw error;
    }

    // Prepare message data for the user's message
    const userMessageData = {
      conversation_id,
      source_msg_id: source_msg_id || null,
      message,
      sender_type,
      feedback_reaction: feedback_reaction || null,
      message_type: message_type || null,
      metadata: metadata || null,
      details: {
        conversation_id,
        currentPage,
        files,
        topic: message,
        llmPayload,
      },
    };

    // Call the service layer to handle the message flow
    const result = await service.handleMessageFlow(userMessageData, files, {
      context: { user: req.user, conversationId: conversation_id },
    });

    // Return success response
    res.status(statusCodes.CREATED).json({
      status: statusCodes.SUCCESS,
      success: true,
      message: "Message added successfully",
      data: result,
    });
  } catch (error) {
    next(error); // Propagate the error to the centralized error handler
  }
};
