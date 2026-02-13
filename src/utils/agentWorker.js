// const { Worker } = require("bullmq");
// const { callAgentApi } = require("../services/agentService");
// const { logger } = require("./logger");
// const { createBullMQConnection } = require("../config/redisClient");
// const { initializeSocketIO } = require("../services/socketService");
// const { keycloak } = require("../config/keycloak");
// const { createServer } = require("http");

// async function initialize() {
//   try {
//     // Create a simple HTTP server for socket.io to attach to
//     const server = createServer();

//     // Initialize socket service BEFORE using it
//     initializeSocketIO(server, keycloak);

//     // Initialize Redis clients and wait for them to connect
//     const bullMQConfig = createBullMQConnection(); // BullMQ-optimized connection

//     const worker = new Worker(
//       "agent-task-queue",
//       async (job) => {
//         const jobName = job.name;
//         logger.info(`Processing job ${job.id} with name: ${jobName}`);
//         if (jobName === "callAgentAPI") {
//           const { userMessage, chatAIMessageId, options, llmPayload, task_id } =
//             job.data; // <<< Destructure task_id here
//           try {
//             // Ensure task_id is logged if present
//             logger.info(
//               `Worker processing job ${job.id} for message ${chatAIMessageId} with task_id: ${task_id}`
//             );

//             const chatAIMessage = await callAgentApi(
//               userMessage,
//               chatAIMessageId,
//               options,
//               llmPayload,
//               task_id // <<< Pass task_id as a separate argument
//             );

//             logger.info(
//               `Worker updated chat message ID: ${chatAIMessageId} in database (Job ID: ${job.id}).`
//             );

//             return {
//               userId: options.context.user.userId,
//               conversationId: options.context.conversationId,
//               chatAIMessage,
//               task_id: task_id, // <<< Include task_id in the return for jobCompletionHandler
//             };
//           } catch (error) {
//             logger.error(
//               `Error processing job ${job.id} for message ID ${chatAIMessageId} (Task ID: ${task_id}):`,
//               error
//             );
//             // Optionally, you might want to include task_id in the error thrown or how it's handled
//             // For now, just re-throwing the original error as per existing pattern
//             throw error;
//           }
//         }
//         // Add more job types here
//         else if (jobName === "someOtherJob") {
//           // Handle some other job
//           logger.info(`Handling 'someOtherJob' job ${job.id}`);
//           // Example: const { data } = job.data;
//           // await someOtherService.process(data);
//           // return { result: "someOtherJob processed" };
//         } else {
//           logger.warn(`Unknown job name: ${jobName} for job ID ${job.id}`);
//         }
//       },
//       {
//         connection: bullMQConfig,
//         // Adjust concurrency as needed, e.g., to limit simultaneous API calls
//         // concurrency: 5,
//       }
//     );

//     worker.on("completed", (job, result) => {
//       const elapsedTime = Date.now() - job.timestamp;
//       logger.info(
//         `Job ${job.id} (Task ${
//           job.data.task_id || "N/A"
//         }) completed in ${elapsedTime}ms`
//       );
//       // Optionally log result if it's not too large
//       // logger.debug(`Job ${job.id} result:`, result);
//     });

//     worker.on("failed", (job, err) => {
//       const elapsedTime = Date.now() - job.timestamp;
//       logger.error(
//         `Job ${job.id} (Task ${
//           job.data.task_id || "N/A"
//         }) failed after ${elapsedTime}ms with error: ${err.message}`,
//         { error: err, jobData: job.data } // Log full error and job data for debugging
//       );
//     });

//     worker.on("error", (err) => {
//       // This is for errors in the worker itself, not specific jobs
//       logger.error("Error in BullMQ worker:", err);
//     });

//     worker.on("active", (job) => {
//       logger.info(
//         `Job ${job.id} (Task ${job.data.task_id || "N/A"}) has started.`
//       );
//     });

//     worker.on("progress", (job, progress) => {
//       logger.info(
//         `Job ${job.id} (Task ${
//           job.data.task_id || "N/A"
//         }) reported progress: ${progress}`
//       );
//     });

//     logger.info("Agent API worker started and connected to Redis.");
//   } catch (error) {
//     logger.error("Worker initialization failed:", error);
//     process.exit(1); // Exit if worker cannot initialize
//   }
// }

// initialize(); // Call the async initialization function

// src/utils/agentWorker.js (or wherever this file is)
const { Worker } = require("bullmq");
const { callAgentApi } = require("../services/agentService");
const { logger } = require("./logger");
const { createBullMQConnection } = require("../config/redisClient");
const { initializeSocketIO } = require("../services/socketService");
const { createServer } = require("http");

async function initialize() {
  try {
    // Create a simple HTTP server for Socket.IO to attach to
    const server = createServer();

    // ✅ Socket.IO will handle Okta auth internally (via socketService.js)
    await initializeSocketIO(server);

    // Initialize Redis connection for BullMQ
    const bullMQConfig = createBullMQConnection();

    const worker = new Worker(
      "{agent-task-queue}",
      async (job) => {
        const jobName = job.name;
        logger.info(`Processing job ${job.id} with name: ${jobName}`);

        if (jobName === "callAgentAPI") {
          const { userMessage, chatAIMessageId, options, llmPayload, task_id } =
            job.data;

          try {
            logger.info(
              `Worker processing job ${job.id} for message ${chatAIMessageId} with task_id: ${task_id}`
            );

            const chatAIMessage = await callAgentApi(
              userMessage,
              chatAIMessageId,
              options,
              llmPayload,
              task_id
            );

            logger.info(
              `Worker updated chat message ID: ${chatAIMessageId} in database (Job ID: ${job.id}).`
            );

            return {
              userId: options.context.user.userId,
              conversationId: options.context.conversationId,
              chatAIMessage,
              task_id,
            };
          } catch (error) {
            logger.error(
              `Error processing job ${job.id} for message ID ${chatAIMessageId} (Task ID: ${task_id}):`,
              error
            );
            throw error;
          }
        } else if (jobName === "someOtherJob") {
          logger.info(`Handling 'someOtherJob' job ${job.id}`);
        } else {
          logger.warn(`Unknown job name: ${jobName} for job ID ${job.id}`);
        }
      },
      {
        connection: bullMQConfig,
      }
    );

    // --- Worker Event Listeners ---
    worker.on("completed", (job, result) => {
      const elapsedTime = Date.now() - job.timestamp;
      logger.info(
        `Job ${job.id} (Task ${job.data.task_id || "N/A"}) completed in ${elapsedTime}ms`
      );
    });

    worker.on("failed", (job, err) => {
      const elapsedTime = Date.now() - job.timestamp;
      logger.error(
        `Job ${job.id} failed after ${elapsedTime}ms: ${err.message}`,
        { error: err }
      );
    });

    worker.on("error", (err) => {
      logger.error("Error in BullMQ worker:", err);
    });

    worker.on("active", (job) => {
      logger.info(
        `Job ${job.id} (Task ${job.data.task_id || "N/A"}) has started.`
      );
    });

    logger.info("Agent API worker started and connected to Redis.");
  } catch (error) {
    logger.error("Worker initialization failed:", error);
    process.exit(1);
  }
}

initialize();
