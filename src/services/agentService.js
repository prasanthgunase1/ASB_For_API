const repository = require("../data/crudRepository");
const { uploadFiles } = require("../utils/uploadFileHelper");
const statusCodes = require("../utils/statusCodes");
const { logger } = require("../utils/logger");
const { endpoints } = require("../config/config");
const fetch = require("node-fetch").default;
const {
  getSubscribeToRequestResults,
  getUnsubscribeFromRequestResults,
} = require("../services/socketService");

/**
 * Helper to safely stringify objects for Snowflake TEXT/VARIANT columns
 */
const safeStringify = (data) => {
  if (typeof data === "object" && data !== null) {
    return JSON.stringify(data);
  }
  return data;
};

/**
 * Helper to safely parse JSON from Snowflake if returned as string
 */
const safeParse = (data) => {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (e) {
      return data; // Return original if not JSON
    }
  }
  return data || {};
};

/**
 * WebSocket-first task status checker
 * Only used as fallback when WebSockets are unavailable
 */
exports.checkTaskStatuses = async (tasks, options = {}) => {
  try {
    logger.info(`Fallback task status check for ${tasks.length} tasks`);
    const results = await Promise.all(
      tasks.map(async (task) => {
        try {
          const res = await fetch(`${endpoints.chatAIStatus}/${task.task_id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            timeout: 10000,
          });
          if (!res.ok) throw new Error(`Status ${res.status}`);
          const data = await res.json();
          
          // Snowflake: Stringify complex objects
          await repository.update(
            "message",
            task.message_id,
            {
              message: JSON.stringify(data),
              metadata: safeStringify({
                status: data.status,
                agent_response: data,
                checked_via: "api_fallback",
                checked_at: new Date().toISOString(),
              }),
            },
            options
          );

          return {
            task_id: task.task_id,
            message_id: task.message_id,
            status: data.status,
            result: data.result || data.answer,
          };
        } catch (err) {
          logger.error(`Error checking task ${task.task_id}:`, err);
          return {
            task_id: task.task_id,
            message_id: task.message_id,
            status: "error",
            error: err.message,
          };
        }
      })
    );
    logger.info("Fallback status check complete");
    return results;
  } catch (err) {
    logger.error("Error in checkTaskStatuses:", err);
    throw err;
  }
};

/**
 * Updates a chatbot message with direct-complete data
 */
exports.updateChatAIMessage = async (
  chatAIMessageData,
  files = [],
  options = {}
) => {
  const { chatAIMessageId, messageType, answer } = chatAIMessageData;
  try {
    const msg = await repository.findById("message", chatAIMessageId, options);
    if (!msg) {
      const e = new Error("ChatAI message not found");
      e.statusCode = statusCodes.NOT_FOUND;
      throw e;
    }

    // Snowflake: Handle potential string metadata
    const existingMetadata = safeParse(msg.metadata);
    
    const metadata = { ...existingMetadata };
    metadata.status = process.env.CHATAI_STATUS_COMPLETED || "completed";
    metadata.agent_response = { message_id: chatAIMessageId, answer };
    
    if (existingMetadata.task_id) metadata.task_id = existingMetadata.task_id;
    if (existingMetadata.request_id) metadata.request_id = existingMetadata.request_id;
    
    metadata.updated_via = "agent_api_direct_complete";
    metadata.updated_at = new Date().toISOString();

    const updated = await repository.update(
      "message",
      chatAIMessageId,
      { 
        message: answer, 
        message_type: messageType, 
        metadata: safeStringify(metadata) // Stringify for Snowflake
      },
      options
    );

    let fileRecords = [];
    if (files.length) {
      const uploaded = await uploadFiles(files, chatAIMessageId, options);
      fileRecords = await Promise.all(
        uploaded.map((f, i) =>
          repository.create(
            "file",
            {
              message_id: chatAIMessageId,
              user_id: options.context.user.username,
              file_name: files[i].originalname,
              file_url: f.fileUrl,
              file_metadata: safeStringify(f.fileMetadata), // Stringify for Snowflake
              file_type: files[i].mimetype,
              file_size: files[i].size,
            },
            options
          )
        )
      );
    }

    // Snowflake: Return plain objects (no .toJSON())
    return {
      ...updated,
      files: fileRecords,
    };
  } catch (err) {
    logger.error(`Error updating chat message: ${err.message}`, {
      error: err,
      chatAIMessageId,
    });
    throw err;
  }
};

const handleStreamingResponse = async (response) => {
  try {
    return await response.text();
  } catch (err) {
    logger.error("Error in handleStreamingResponse:", err);
    throw err;
  }
};

const getFileType = (fileName) => {
  const ext = fileName.split(".").pop().toLowerCase();
  return ext;
};

const transformFiles = (files) => {
  if (!Array.isArray(files)) return [];
  return files.map((file) => {
    try {
      // Handle metadata parsing if string
      const metadata = safeParse(file.file_metadata);

      const fileExt =
        file.file_type?.split("/")?.pop() || getFileType(file.file_name || "");

      const simpleFileType =
        fileExt === "pdf" ? "pdf"
          : fileExt === "presentation" ? "pptx"
          : fileExt === "document" ? "docx"
          : fileExt === "sheet" ? "xlsx"
          : fileExt;

      let blobPath = "";
      if (metadata.file_path) {
        const cleanPath = metadata.file_path.replace(/^\/+/, "");
        if (cleanPath.startsWith("ai-for-insights/")) {
          blobPath = cleanPath.split("ai-for-insights/")[1];
        }
      } else if (file.blob_path) {
        blobPath = file.blob_path;
      }

      const actualFileName = blobPath.split("/").pop() || file.file_name || "";

      return {
        file_name: actualFileName,
        upload_time: file.created_at || new Date().toISOString(),
        blob_path: blobPath,
        file_type: simpleFileType,
      };
    } catch (err) {
      logger.error(`Error transforming file ${file.id || ""}:`, err);
      return {
        file_name: file.file_name || "",
        upload_time: file.created_at || new Date().toISOString(),
        blob_path: "",
        file_type: getFileType(file.file_name || ""),
      };
    }
  });
};

/**
 * Calls Python LLM API and manages Redis Pub/Sub subscription
 */
exports.callAgentApi = async (
  message,
  chatAIMessageId,
  options,
  llmPayload,
  task_id
) => {
  try {
    const endpoint = llmPayload.msg_id
      ? endpoints.chatAISelection
      : endpoints.chatAI;
      
    const payload = llmPayload.msg_id
      ? llmPayload.msgPayload
      : {
          chat_id: String(llmPayload.chat_id),
          user_files_uploads: transformFiles(
            llmPayload.user_files_uploads || []
          ),
          query: llmPayload.query || message,
          screen_type: llmPayload.screen_type,
          persona_profiler: {
            persona: llmPayload.persona_profiler.persona,
            industry: llmPayload.persona_profiler.industry,
            client_id: Number(llmPayload.persona_profiler.client_id),
            persona_id: Number(llmPayload.persona_profiler.persona_id),
            user_id: String(llmPayload.persona_profiler.user_id),
            industry_id: Number(llmPayload.persona_profiler.industry_id),
          },
        };

    if (!llmPayload.msg_id && chatAIMessageId) {
      payload.ques_id = String(chatAIMessageId);
    }

    // Subscribe Logic
    const subscribe = getSubscribeToRequestResults();
    if (typeof subscribe === "function" && chatAIMessageId && task_id) {
      try {
        await subscribe(
          String(chatAIMessageId),
          String(llmPayload.chat_id),
          options.context.user.username,
          String(task_id)
        );
      } catch (subscribeError) {
        logger.error(`[AGENT DEBUG] Failed to subscribe: ${subscribeError.message}`);
      }
    }

    logger.info(`Sending request to ${endpoint} for message ${chatAIMessageId}`);
    
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      timeout: 120000,
    });
    
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Status ${res.status}: ${errText}`);
    }
    
    const text = await handleStreamingResponse(res);
    const parsed = JSON.parse(text);
    console.log("Response Received:", parsed);

    const status = parsed.status?.toUpperCase();
    
    // Async Processing Path
    if (status === "PROCESSING" || status === "QUEUED") {
      const orig = String(chatAIMessageId);
      const rid = parsed.request_id ? String(parsed.request_id) : orig;
      
      if (rid !== orig) {
        const unsub = getUnsubscribeFromRequestResults();
        await unsub(orig);
        await subscribe(
          rid,
          String(llmPayload.chat_id),
          options.context.user.username,
          String(task_id)
        );
      }
      
      await repository.update(
        "message",
        chatAIMessageId,
        {
          message: status === "PROCESSING"
              ? ""
              : JSON.stringify({
                  status,
                  request_id: rid,
                  message: parsed.message,
                }),
          metadata: safeStringify({
            status,
            request_id: rid,
            original_message_id: chatAIMessageId,
            task_id,
            updated_at: new Date().toISOString(),
            queued_at: new Date().toISOString(),
            api_response_on_call: parsed,
          }),
        },
        options
      );
      
      return {
        status: statusCodes.PROCESSING,
        data: {
          chataiMessageId: chatAIMessageId,
          status,
          request_id: rid,
          task_id,
          message: parsed.message,
        },
      };
    }

    // Direct Completion Path
    const answer = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    const updatedMsg = await exports.updateChatAIMessage(
      { chatAIMessageId, messageType: "text", answer },
      parsed.files || [],
      options
    );
    
    if (task_id) {
      try {
        await repository.update(
          "task",
          task_id,
          {
            status: "COMPLETE",
            result: answer,
            updated_at: new Date(), // Snowflake timestamp
          },
          {}
        );
      } catch (e) {
        logger.warn(`Failed to update task status: ${e.message}`);
      }
    }
    
    const unsub = getUnsubscribeFromRequestResults();
    await unsub(String(chatAIMessageId));
    if (parsed.request_id && parsed.request_id !== chatAIMessageId) {
      await unsub(String(parsed.request_id));
    }
    
    return { status: statusCodes.SUCCESS, data: updatedMsg };
    
  } catch (err) {
    logger.error(`callAgentApi error for ${chatAIMessageId}: ${err.message}`, { error: err });
    
    try {
      await repository.update(
        "message",
        chatAIMessageId,
        {
          message: JSON.stringify({ status: "ERROR", error: err.message }),
          metadata: safeStringify({
            status: "ERROR",
            task_id,
            error_details: err.message,
            updated_at: new Date().toISOString(),
          }),
        },
        options
      );
      
      if (task_id) {
        await repository.update(
          "task",
          task_id,
          {
            status: "ERROR",
            result: err.message,
            updated_at: new Date(),
          },
          {}
        );
      }
    } catch (e) { /* ignore cleanup error */ }
    
    throw err;
  }
};

/**
 * Calls dashboard API for home screen data
 */
exports.callDashboardAPI = async (inputParams) => {
  try {
    logger.info(`Calling dashboard API with params: ${JSON.stringify(inputParams)}`);
    const requestBody = JSON.stringify({
      persona_id: Number(inputParams.persona_id),
      user_id: String(inputParams.user_id),
    });
    
    const res = await fetch(endpoints.homeDashboardAPI, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: requestBody,
      timeout: 60000,
    });
    
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Status ${res.status}: ${body}`);
    }
    
    const text = await handleStreamingResponse(res);
    return JSON.parse(text);
  } catch (err) {
    logger.error("Error in callDashboardAPI:", err);
    throw err;
  }
};