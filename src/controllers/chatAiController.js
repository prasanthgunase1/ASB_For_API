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
    
    const files = req.files || []; // Ensure files is at least an empty array

    // Robust parsing for llmPayload (handles both multipart/form-data strings and JSON body objects)
    let llmPayload = {};
    if (req.body.llmPayload) {
      if (typeof req.body.llmPayload === "string") {
        try {
          llmPayload = JSON.parse(req.body.llmPayload);
        } catch (e) {
          const error = new Error("Invalid JSON in llmPayload");
          error.statusCode = statusCodes.BAD_REQUEST;
          throw error;
        }
      } else {
        llmPayload = req.body.llmPayload;
      }
    }

    // Validate sender_type
    if (sender_type === "chatai") {
      const error = new Error(
        "sender_type cannot be 'chatai' for user messages"
      );
      error.statusCode = statusCodes.BAD_REQUEST;
      throw error;
    }

    // Prepare message data for the user's message
    // Note: We pass plain objects here. The Service layer handles 
    // stringifying 'metadata' and 'details' for Snowflake TEXT columns.
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
        files, // Pass file info to details for debugging/logging if needed
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