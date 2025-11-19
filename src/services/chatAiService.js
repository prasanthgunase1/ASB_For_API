const repository = require("../data/crudRepository");
const { uploadFiles } = require("../utils/uploadFileHelper");
const { pushMessageToQueue } = require("./queueService");
const { v4: uuidv4 } = require("uuid");
const { logger } = require("../utils/logger");
const { getSendResponse, SOCKET_EVENTS } = require("./socketService");

exports.handleMessageFlow = async (
  userMessageData,
  files = [],
  options = {}
) => {
  const task_id = uuidv4();
  try {
    // 1) Create user message
    const userMessage = await repository.create(
      "message",
      userMessageData,
      options
    );

    // 2) Upload files
    let userFilesArray = [];
    if (files.length) {
      const uploaded = await uploadFiles(files, userMessage.id, options);
      userFilesArray = await Promise.all(
        uploaded.map((f) =>
          repository.create(
            "file",
            {
              message_id: userMessage.id,
              file_name: f.fileName,
              file_type: f.fileType,
              file_url: f.fileUrl,
              file_metadata: f.fileMetadata || {},
              file_size: f.fileSize || 0,
              user_id: options.context?.user?.username,
            },
            options
          )
        )
      );
    }

    userMessageData.details.llmPayload.user_files_uploads = userFilesArray.map(
      (f) => {
        const metadata =
          typeof f.file_metadata === "string"
            ? JSON.parse(f.file_metadata)
            : f.file_metadata || {};

        // Extract file extension for simple file type
        const fileName = f.file_name || "";
        const fileExt = fileName.split(".").pop().toLowerCase();

        // Format the blob path correctly
        let blobPath = "";
        if (metadata.file_path) {
          // Remove leading slash
          const cleanPath = metadata.file_path.replace(/^\/+/, "");

          // Extract just the relevant part after the container name
          if (cleanPath.startsWith("ai-for-insights/")) {
            const parts = cleanPath.split("ai-for-insights/");
            if (parts.length > 1) {
              // Keep the full original path with the unique identifier
              blobPath = parts[1];
            }
          }
        }

        return {
          id: f.id,
          file_name: fileName,
          file_url: f.file_url,
          file_type: fileExt, // Simple extension like 'pdf', 'pptx'
          file_size: f.file_size,
          blob_path: blobPath, // Now correctly using the original path with unique ID
          file_metadata: metadata,
          created_at: f.created_at,
        };
      }
    );

    userMessageData.details.llmPayload.parentMsgId = userMessage.id;

    // 3) Create AI placeholder
    const placeholder = {
      conversation_id: userMessageData.conversation_id,
      source_msg_id: userMessage.id,
      sender_type: "chatai",
      message: JSON.stringify({
        status: "PENDING",
        task_id,
        timestamp: Date.now(),
      }),
      message_type: "text",
      metadata: { status: "pending", task_id },
    };
    const chatAIMessage = await repository.create(
      "message",
      placeholder,
      options
    );

    // 4) Initial WS notify
    try {
      const send = getSendResponse();
      if (typeof send === "function") {
        // user message emitted
        await send(
          options.context.user.username,
          String(userMessage.conversation_id),
          {
            type: SOCKET_EVENTS.CONVERSATION_MESSAGE,
            conversation_id: String(userMessage.conversation_id),
            message_id: String(userMessage.id),
            content: userMessage.message,
            status: "SENT",
            metadata: userMessage.metadata,
            sender_type: userMessage.sender_type,
            files: userFilesArray.map((f) => (f.toJSON ? f.toJSON() : f)), // Include processed files
            timestamp: Date.now(),
          }
        );
        // ai placeholder emitted
        await send(
          options.context.user.username,
          String(chatAIMessage.conversation_id),
          {
            type: SOCKET_EVENTS.CONVERSATION_MESSAGE,
            conversation_id: String(chatAIMessage.conversation_id),
            message_id: String(chatAIMessage.id),
            content: chatAIMessage.message,
            status: "PENDING",
            metadata: chatAIMessage.metadata,
            sender_type: chatAIMessage.sender_type,
            task_id,
            timestamp: Date.now(),
          }
        );
      }
    } catch (sockErr) {
      logger.warn("WebSocket notify failed:", sockErr);
    }

    // 5) Queue job
    await pushMessageToQueue("callAgentAPI", {
      userMessage: userMessage.message,
      chatAIMessageId: chatAIMessage.id,
      options,
      llmPayload: userMessageData.details.llmPayload,
      task_id,
      conversation_id: userMessageData.conversation_id,
      user_id: options.context.user.username,
    });

    // 6) Create Task record
    try {
      await repository.create(
        "task",
        {
          task_id,
          user_id: options.context.user.username,
          chat_id: userMessageData.conversation_id,
          message_id: chatAIMessage.id,
          request_id: chatAIMessage.id,
          status: "PENDING",
        },
        options
      );
    } catch (e) {
      logger.warn(`Task record creation failed for ${task_id}`, e);
    }

    return {
      userMessage: {
        ...(userMessage.toJSON ? userMessage.toJSON() : userMessage),
        files: userFilesArray.map((f) => (f.toJSON ? f.toJSON() : f)),
      },
      chatAIMessage: {
        ...(chatAIMessage.toJSON ? chatAIMessage.toJSON() : chatAIMessage),
        files: [],
      },
      task_id,
    };
  } catch (error) {
    logger.error(
      `Message flow error [task ${task_id}]: ${error.message}`,
      error
    );
    throw error;
  }
};

exports.updateChatMessage = async (
  messageId,
  content,
  metadataChanges = {},
  options = {}
) => {
  try {
    const existing = await repository.findById("message", messageId, options);
    const newMeta = {
      ...existing.metadata,
      ...metadataChanges,
      updated_at: new Date().toISOString(),
    };
    return await repository.update(
      "message",
      messageId,
      { message: content, metadata: newMeta },
      options
    );
  } catch (error) {
    logger.error(
      `Error updating message ${messageId}: ${error.message}`,
      error
    );
    throw error;
  }
};

exports.updateTaskStatus = async (task_id, status, result = null) => {
  try {
    // First check if task exists
    const task = await repository.findById("task", task_id, { quiet: true });

    if (!task) {
      logger.warn(`Task ${task_id} not found for status update to ${status}`);
      // You could create a task record here if appropriate
      // Or just return without error
      return null;
    }

    return await repository.update(
      "task",
      task_id,
      {
        status: status.toUpperCase(),
        result: result ? JSON.stringify(result) : null,
      },
      { systemUpdate: true }
    );
  } catch (error) {
    logger.error(`Error updating task ${task_id} status: ${error.message}`);
    throw error;
  }
};
