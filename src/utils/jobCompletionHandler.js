// const { logger } = require("./logger");
// const statusCodes = require("../utils/statusCodes");
// const chatAiService = require("../services/chatAiService");

// /**
//  * Map of job handlers. Add new job types here as needed.
//  */
// const jobHandlers = {
//   callAgentAPI: async ({ userId, conversationId, chatAIMessage, task_id }) => {
//     const responseStatus = chatAIMessage?.data?.status || "UNKNOWN";

//     // 1) Update Task status in RGM.Task
//     if (task_id) {
//       try {
//         await chatAiService.updateTaskStatus(
//           task_id,
//           responseStatus,
//           chatAIMessage.data?.message ?? null
//         );
//         logger.info(`Updated task status for ${task_id} to ${responseStatus}`);
//       } catch (taskError) {
//         logger.warn(
//           `Non-critical task update error for ${task_id}: ${taskError.message}`
//         );
//       }
//     }

//     // 2) Notify via WebSocket
//     await notifyMessageProcessed(
//       userId,
//       conversationId,
//       chatAIMessage,
//       task_id
//     );
//   },
//   // ... add more handlers keyed by jobName
// };

// /**
//  * Entry point for job completion.
//  * @param {string} jobName
//  * @param {object} result
//  */
// exports.handleJobCompletion = async (jobName, result) => {
//   logger.info(`handleJobCompletion called for ${jobName}`, { result });
//   const handler = jobHandlers[jobName];
//   if (!handler) {
//     logger.error(`Unhandled job type: ${jobName}`);
//     throw new Error(`No handler for job: ${jobName}`);
//   }

//   try {
//     await handler(result);
//     logger.info(`Successfully handled job: ${jobName}`);
//   } catch (error) {
//     logger.error(`Error handling job ${jobName}: ${error.message}`, { error });
//     if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") {
//       logger.error(
//         `Azure network error when handling job ${jobName}: ${error.code}`
//       );
//     }
//     throw error;
//   }
// };

// /**
//  * Notify processed message via WebSocket.
//  * Extracts actual status from chatAIMessage and sends payload.
//  *
//  * @param {string} userId
//  * @param {number|string} conversationId
//  * @param {{ data: object }} chatAIMessage
//  * @param {string|null} task_id
//  */
// async function notifyMessageProcessed(
//   userId,
//   conversationId,
//   chatAIMessage,
//   task_id = null
// ) {
//   try {
//     logger.info(
//       `notifyMessageProcessed for user ${userId}, conversation ${conversationId}` +
//         (task_id ? `, task ${task_id}` : "")
//     );

//     if (!userId || !conversationId || !chatAIMessage) {
//       const err = new Error("Missing parameters in notifyMessageProcessed");
//       err.statusCode = statusCodes.BAD_REQUEST;
//       logger.error(err.message, { userId, conversationId, task_id });
//       throw err;
//     }

//     // defer require to break circular dependency
//     const socketService = require("../services/socketService");
//     const getSendResponse = socketService.getSendResponse;
//     const SOCKET_EVENTS = socketService.SOCKET_EVENTS;

//     if (typeof getSendResponse !== "function") {
//       logger.error("socketService.getSendResponse is not a function");
//       return;
//     }
//     const sendResponse = getSendResponse();
//     if (typeof sendResponse !== "function") {
//       logger.error("sendResponse() is not a function");
//       return;
//     }

//     // determine actual status
//     let actualStatus = "COMPLETED";
//     const data = chatAIMessage.data || {};
//     if (data.status) {
//       actualStatus = data.status.toUpperCase();
//     } else if (typeof data.message === "string") {
//       try {
//         const parsed = JSON.parse(data.message);
//         if (parsed?.status) actualStatus = parsed.status.toUpperCase();
//       } catch {}
//     } else if (data.metadata?.status) {
//       actualStatus = data.metadata.status.toUpperCase();
//     }

//     logger.info(`Determined actualStatus=${actualStatus} for task ${task_id}`);

//     // Build payload
//     let payload;
//     if (data.hasOwnProperty("result")) {
//       // new format
//       payload = {
//         request_id: task_id || data.id,
//         status: actualStatus,
//         elapsed_time: data.elapsed_time ?? 0,
//         result: data.result,
//       };
//     } else {
//       // legacy format: send the whole chatAIMessage.data
//       // but merge in task_id and status if missing
//       if (!data.metadata) data.metadata = {};
//       if (task_id) data.metadata.task_id = task_id;
//       data.metadata.status = actualStatus.toLowerCase();
//       data.metadata.completed_via = "job_queue";
//       data.metadata.completed_at = new Date().toISOString();
//       payload = data;
//     }

//     // emit
//     await sendResponse(userId, String(conversationId), payload);
//     logger.info(
//       `WebSocket notification sent for conversation ${conversationId}, task ${task_id}`
//     );
//   } catch (error) {
//     // Azure-specific Redis errors
//     if (error.code === "ECONNREFUSED") {
//       logger.error("Redis connection refused. Check Azure Redis settings.");
//     } else if (error.code === "ETIMEDOUT") {
//       logger.error("Redis connection timed out. Check network latency.");
//     } else if (error.message && error.message.includes("ECONNRESET")) {
//       logger.error("Redis connection reset. Possible Azure network issue.");
//     } else if (error.message && error.message.includes("CERT_HAS_EXPIRED")) {
//       logger.error(
//         "Redis SSL certificate validation failed. Check Azure Redis configuration."
//       );
//     } else {
//       logger.error(`notifyMessageProcessed error: ${error.message}`, {
//         error,
//       });
//     }
//     // do not re-throw to avoid breaking job flow
//   }
// }


const { logger } = require("./logger");
const statusCodes = require("../utils/statusCodes");
const chatAiService = require("../services/chatAiService");

/**
 * Map of job handlers. Add new job types here as needed.
 */
const jobHandlers = {
  callAgentAPI: async ({ userId, conversationId, chatAIMessage, task_id }) => {
    // Safely extract status using optional chaining
    const responseStatus = chatAIMessage?.data?.status || "UNKNOWN";

    // 1) Update Task status in Database (Postgres)
    if (task_id) {
      try {
        // Ensure chatAiService.updateTaskStatus is updated to use Sequelize models!
        await chatAiService.updateTaskStatus(
          task_id,
          responseStatus,
          chatAIMessage.data?.message ?? null
        );
        logger.info(`Updated task status for ${task_id} to ${responseStatus}`);
      } catch (taskError) {
        logger.warn(
          `Non-critical task update error for ${task_id}: ${taskError.message}`
        );
      }
    }

    // 2) Notify via WebSocket
    await notifyMessageProcessed(
      userId,
      conversationId,
      chatAIMessage,
      task_id
    );
  },
  // ... add more handlers keyed by jobName
};

/**
 * Entry point for job completion.
 * @param {string} jobName
 * @param {object} result
 */
exports.handleJobCompletion = async (jobName, result) => {
  logger.info(`handleJobCompletion called for ${jobName}`, { result });
  
  const handler = jobHandlers[jobName];
  if (!handler) {
    logger.error(`Unhandled job type: ${jobName}`);
    throw new Error(`No handler for job: ${jobName}`);
  }

  try {
    await handler(result);
    logger.info(`Successfully handled job: ${jobName}`);
  } catch (error) {
    logger.error(`Error handling job ${jobName}: ${error.message}`, { error });
    
    // Generic Network Error Handling (Cloud Agnostic)
    if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") {
      logger.error(
        `Network error when handling job ${jobName}. Check VPC/Security Group settings. Code: ${error.code}`
      );
    }
    throw error;
  }
};

/**
 * Notify processed message via WebSocket.
 * Extracts actual status from chatAIMessage and sends payload.
 *
 * @param {string} userId
 * @param {number|string} conversationId
 * @param {{ data: object }} chatAIMessage
 * @param {string|null} task_id
 */
async function notifyMessageProcessed(
  userId,
  conversationId,
  chatAIMessage,
  task_id = null
) {
  try {
    logger.info(
      `notifyMessageProcessed for user ${userId}, conversation ${conversationId}` +
        (task_id ? `, task ${task_id}` : "")
    );

    if (!userId || !conversationId || !chatAIMessage) {
      const err = new Error("Missing parameters in notifyMessageProcessed");
      err.statusCode = statusCodes.BAD_REQUEST;
      logger.error(err.message, { userId, conversationId, task_id });
      throw err;
    }

    // defer require to break circular dependency
    const socketService = require("../services/socketService");
    const getSendResponse = socketService.getSendResponse;

    if (typeof getSendResponse !== "function") {
      logger.error("socketService.getSendResponse is not a function");
      return;
    }
    
    const sendResponse = getSendResponse();
    if (typeof sendResponse !== "function") {
      logger.error("sendResponse() is not a function");
      return;
    }

    // determine actual status
    let actualStatus = "COMPLETED";
    const data = chatAIMessage.data || {};
    
    if (data.status) {
      actualStatus = data.status.toUpperCase();
    } else if (typeof data.message === "string") {
      try {
        const parsed = JSON.parse(data.message);
        if (parsed?.status) actualStatus = parsed.status.toUpperCase();
      } catch {}
    } else if (data.metadata?.status) {
      actualStatus = data.metadata.status.toUpperCase();
    }

    logger.info(`Determined actualStatus=${actualStatus} for task ${task_id}`);

    // Build payload
    let payload;
    
    // Check for "result" key to determine if this is the new format
    if (Object.prototype.hasOwnProperty.call(data, "result")) {
      // New format (matches new Postgres schema usually)
      payload = {
        request_id: task_id || data.id,
        status: actualStatus,
        elapsed_time: data.elapsed_time ?? 0,
        result: data.result,
      };
    } else {
      // Legacy format: send the whole chatAIMessage.data
      if (!data.metadata) data.metadata = {};
      if (task_id) data.metadata.task_id = task_id;
      
      data.metadata.status = actualStatus.toLowerCase();
      data.metadata.completed_via = "job_queue";
      data.metadata.completed_at = new Date().toISOString();
      payload = data;
    }

    // emit
    await sendResponse(userId, String(conversationId), payload);
    logger.info(
      `WebSocket notification sent for conversation ${conversationId}, task ${task_id}`
    );

  } catch (error) {
    // AWS ElastiCache / Redis Error Handling
    if (error.code === "ECONNREFUSED") {
      logger.error("Redis connection refused. Check AWS ElastiCache Endpoint and Port.");
    } else if (error.code === "ETIMEDOUT") {
      logger.error("Redis connection timed out. Check AWS Security Groups (VPC) allow traffic.");
    } else if (error.message && error.message.includes("ECONNRESET")) {
      logger.error("Redis connection reset. Network interruption.");
    } else {
      logger.error(`notifyMessageProcessed error: ${error.message}`, {
        error,
      });
    }
    // do not re-throw to avoid breaking job flow
  }
}