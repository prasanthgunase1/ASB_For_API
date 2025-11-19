// queueService.js
const { Queue, QueueEvents } = require("bullmq");
const { createBullMQConnection } = require("../config/redisClient");
const { logger } = require("../utils/logger");
const { handleJobCompletion } = require("../utils/jobCompletionHandler");

// Global queue instances (BullMQ automatically manages Redis sync)
const queueName = "agent-task-queue";
const agentQ = new Queue(queueName, {
  connection: createBullMQConnection(),
});

const qEvents = new QueueEvents(queueName, {
  connection: createBullMQConnection(),
});

// Event listeners (setup once globally)
qEvents.on("completed", async ({ jobId }) => {
  try {
    const job = await agentQ.getJob(jobId);
    if (job && job.returnvalue) {
      logger.info(`[QueueEvents] Job ${jobId} completed in agentQ`);
      await handleJobCompletion(job.name, job.returnvalue);
    }
  } catch (error) {
    logger.error(`Error handling completed job ${jobId}:`, error);
  }
});

qEvents.on("failed", ({ jobId, failedReason }) => {
  logger.error(`[QueueEvents] Job ${jobId} failed: ${failedReason}`);
});

qEvents.on("error", (error) => {
  logger.error(`[QueueEvents] Error in agentQ:`, error);
});

/**
 * Pushes message to a specified queue.
 * @param {string} jobName - The name of the job to add.
 * @param {object} data - The data to push to the queue.
 */
async function pushMessageToQueue(jobName, data) {
  try {
    await agentQ.add(jobName, data);

    logger.info(
      `Job "${jobName}" added to queue "${queueName}" with data: ${JSON.stringify(
        data
      )}`
    );
  } catch (error) {
    logger.error(`Error adding job to queue "${queueName}":`, error);
    throw error;
  }
}

module.exports = {
  pushMessageToQueue,
  agentQ, // Export the queue instance if needed elsewhere
};
