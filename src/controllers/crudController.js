const service = require("../services/crudService");
const statusCodes = require("../utils/statusCodes");
const chataiController = require('./chatAiController'); 

exports.getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || parseInt(process.env.DEFAULT_PAGE || 1);
    const limit = parseInt(req.query.limit) || parseInt(process.env.DEFAULT_LIMIT || 10);

    // Pass the query parameters and logged-in user's ID to the service
    const data = await service.getAll(req.params.model, {
      page,
      limit,
      context: { user: req.user },
      filters: req.query,
    });

    // --- SNOWFLAKE COMPATIBILITY CHANGE ---
    // Handle if 'data' is a raw array (Snowflake) or a structured object (Service/Sequelize)
    // This prevents the code from crashing if data.rows is undefined.
    const items = Array.isArray(data) ? data : (data && data.rows ? data.rows : []);
    
    // Calculate total items. If 'count' exists (from Service), use it. 
    // Otherwise fallback to the length of the current page (raw array).
    const totalItems = (data && data.count !== undefined) ? data.count : items.length;
    // --------------------------------------

    res.status(statusCodes.SUCCESS).json({
      status: statusCodes.SUCCESS,
      success: true,
      message: "Data fetched successfully",
      data: items,
      pagination: {
        total_items: totalItems,
        total_pages: Math.ceil(totalItems / limit),
        current_page: parseInt(page),
        page_size: parseInt(limit),
      },
    });
  } catch (error) {
    next(error); // Propagate error to centralized error handler
  }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await service.getById(req.params.model, req.params.id, {
      context: { user: req.user },
    });
    if (!data) {
      const error = new Error("Record not found");
      error.statusCode = statusCodes.NOT_FOUND;
      throw error;
    }
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

exports.create = async (req, res, next) => {
  try {
    if (req.params.model === 'message') {
      await chataiController.addMessage(req, res, next);
      if (res.headersSent) {
        return;
      }
    } else {
      const data = await service.create(req.params.model, req.body, {
        context: { user: req.user },
      });
      res.status(statusCodes.CREATED).json({
        status: statusCodes.SUCCESS,
        success: true,
        message: "Record created successfully",
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const dataToUpdate = { ...req.body };
    
    // --- SNOWFLAKE COMPATIBILITY CHANGE ---
    // Snowflake columns are often Case Sensitive or UPPERCASE.
    // We must ensure we strip the Primary Key so we don't try to update it.
    delete dataToUpdate.id;       // Lowercase (standard JS)
    delete dataToUpdate.ID;       // Uppercase (Snowflake standard)
    delete dataToUpdate.userId;   // CamelCase
    delete dataToUpdate.USER_ID;  // Snake Case (Database standard)
    // --------------------------------------

    const data = await service.update(
      req.params.model,
      req.params.id,
      dataToUpdate,
      { context: { user: req.user } }
    );

    if (!data) {
      const error = new Error("Record not found");
      error.statusCode = statusCodes.NOT_FOUND;
      throw error;
    }
    res.status(statusCodes.SUCCESS).json({
      status: statusCodes.SUCCESS,
      success: true,
      message: "Data updated successfully",
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const data = await service.delete(req.params.model, req.params.id,
      { context: { user: req.user } });
    if (!data) {
      const error = new Error("Record not found");
      error.statusCode = statusCodes.NOT_FOUND;
      throw error;
    }
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