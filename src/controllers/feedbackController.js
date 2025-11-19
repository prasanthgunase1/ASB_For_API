// controllers/feedbackController.js

const feedbackService = require('../services/feedbackService');
const statusCodes = require('../utils/statusCodes');
const { logger } = require("../utils/logger");

exports.redisHealthCheck = async (req, res, next) => {
  try {
    const data = await feedbackService.checkRedisHealth();
    res.status(statusCodes.SUCCESS).json({
      status: statusCodes.SUCCESS,
      success: true,
      message: "Redis health check successful",
      data: data,
    });
  } catch (error) {
    next(error); // Pass error to the global handler
  }
};

exports.updateFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.body.reaction) {
      const error = new Error("A 'reaction' is required in the request body");
      error.statusCode = statusCodes.BAD_REQUEST;
      throw error;
    }

    const data = await feedbackService.addOrUpdateFeedback(id, req.body, req.user);
    res.status(statusCodes.SUCCESS).json({
      status: statusCodes.SUCCESS,
      success: true,
      message: "Feedback updated successfully",
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.getFeedbacks = async (req, res, next) => {
  try {
    const data = await feedbackService.getAllFeedbacks(req.query);
    res.status(statusCodes.SUCCESS).json({
      status: statusCodes.SUCCESS,
      success: true,
      message: "Data fetched successfully",
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.getFeedback = async (req, res, next) => {
  try {
    const data = await feedbackService.getFeedbackById(req.params.id);
    res.status(statusCodes.SUCCESS).json({
      status: statusCodes.SUCCESS,
      success: true,
      message: "Data fetched successfully",
      data: { messageId: req.params.id, ...data },
    });
  } catch (error) {
    next(error);
  }
};

exports.removeFeedback = async (req, res, next) => {
    try {
        await feedbackService.deleteFeedback(req.params.id, req.user);
        res.status(statusCodes.SUCCESS).json({
          status: statusCodes.SUCCESS,
          success: true,
          message: "Data deleted successfully",
          data: {},
        });
    } catch (error) {
        next(error);
    }
};

exports.removeAllFeedbacks = async (req, res, next) => {
    try {
        const deletedCount = await feedbackService.deleteAllFeedbacks();
        if (deletedCount === 0) {
            const error = new Error("No feedback entries to delete");
            error.statusCode = statusCodes.NOT_FOUND;
            throw error;
        }
        res.status(statusCodes.SUCCESS).json({
          status: statusCodes.SUCCESS,
          success: true,
          message: `Successfully deleted ${deletedCount} feedback entries.`,
          data: { count: deletedCount },
        });
    } catch (error) {
        next(error);
    }
};