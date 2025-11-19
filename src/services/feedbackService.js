// services/feedbackService.js

const { createRedisClient } = require("../config/redisClient");
const { logger } = require("../utils/logger");
const crudService = require('./crudService');
const statusCodes = require('../utils/statusCodes');

// Initialize a single Redis client for this service
let redisClient;
(async () => {
  try {
    redisClient = await createRedisClient();
    logger.info("✅ Redis client initialized for Feedback Service.");
  } catch (error) {
    logger.error("❌ Failed to initialize Redis client for Feedback Service.", error);
  }
})();

const checkRedisHealth = async () => {
  if (!redisClient || !redisClient.isReady) {
    const error = new Error("Redis client is not connected");
    error.statusCode = statusCodes.SERVICE_UNAVAILABLE;
    throw error;
  }
  const reply = await redisClient.ping();
  if (reply !== "PONG") {
    throw new Error("Redis returned an unexpected reply");
  }
  return { status: "ok", message: "Redis is connected and responding" };
};

const addOrUpdateFeedback = async (messageId, feedbackPayload, user) => {
  const { reaction, comment, email, personaId, conversationId } = feedbackPayload;

  // 1. Update the database using the existing crudService
  if (reaction) {
    await crudService.update('message', messageId, { feedback_reaction: reaction }, {
      context: { user }
    });
  }
  
  // 2. Save full details to Redis
  const redisKey = `feedback:${messageId}`;
  const dataToSave = {
    reaction: String(reaction),
    comment: String(comment || ""),
    timestamp: Date.now().toString(),
    email: String(email),
    personaId: String(personaId || ""),
    conversationId: String(conversationId || ""),
  };
  await redisClient.hSet(redisKey, dataToSave);
  return { success: true, messageId };
};

const getAllFeedbacks = async (filters) => {
  const { email, personaId, conversationId, reaction } = filters;
  const allFeedbacks = [];
  const keys = await redisClient.keys("feedback:*");

  for (const key of keys) {
    const feedback = await redisClient.hGetAll(key);
    // Filtering logic remains the same
    if (
      (!email || feedback.email?.toLowerCase() === email.toLowerCase()) &&
      (!personaId || feedback.personaId === String(personaId)) &&
      (!conversationId || feedback.conversationId === String(conversationId)) &&
      (!reaction || feedback.reaction === String(reaction))
    ) {
      allFeedbacks.push({ messageId: key.replace("feedback:", ""), ...feedback });
    }
  }

  if (allFeedbacks.length === 0) {
      const error = new Error("No matching feedbacks found");
      error.statusCode = statusCodes.NOT_FOUND;
      throw error;
  }
  return allFeedbacks;
};

const getFeedbackById = async (messageId) => {
  const redisKey = `feedback:${messageId}`;
  const feedback = await redisClient.hGetAll(redisKey);
  
  if (!feedback || Object.keys(feedback).length === 0) {
    const error = new Error("Record not found");
    error.statusCode = statusCodes.NOT_FOUND;
    throw error;
  }
  return feedback;
};

const deleteFeedback = async (messageId, user) => {
  const redisKey = `feedback:${messageId}`;
  const result = await redisClient.del(redisKey);

  if (result === 0) {
    const error = new Error("Record not found");
    error.statusCode = statusCodes.NOT_FOUND;
    throw error;
  }

  // Also clear the reaction from the primary database
  await crudService.update('message', messageId, { feedback_reaction: null }, {
    context: { user }
  });

  return { success: true };
};

const deleteAllFeedbacks = async () => {
    const keys = await redisClient.keys("feedback:*");
    if (keys.length === 0) {
        return 0; // Return count, controller will handle 404
    }
    return await redisClient.del(keys);
};

module.exports = {
  checkRedisHealth,
  addOrUpdateFeedback,
  getAllFeedbacks,
  getFeedbackById,
  deleteFeedback,
  deleteAllFeedbacks,
};