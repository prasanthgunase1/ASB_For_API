const repository = require("../data/crudRepository");
const statusCodes = require("../utils/statusCodes");

exports.getAll = async (model, options = {}) => {
  try {
    const { page, limit, context, filters } = options;
    const offset = (page - 1) * limit;
    // Build the where clause dynamically
    const where = {};
    // Add filters from query parameters
    if (filters) {
      for (const key in filters) {
        if (key !== "page" && key !== "limit") {
          // Exclude pagination parameters
          where[key] = filters[key];
        }
      }
    }
    const queryOptions = { ...options, offset, limit, where, context };
    const data = await repository.findAll(model, queryOptions);
    return data;
  } catch (error) {
    throw error;
  }
};

exports.getById = async (model, id, options = {}) => {
  try {
    const data = await repository.findById(model, id, options);
    return data;
  } catch (error) {
    throw error;
  }
};

exports.create = async (model, data, options = {}) => {
  try {
    if (!data) {
      const error = new Error("Invalid input data");
      error.statusCode = statusCodes.BAD_REQUEST;
      throw error;
    }
    const createdRecord = await repository.create(model, data, options);
    return createdRecord;
  } catch (error) {
    throw error;
  }
};

exports.update = async (model, id, data, options = {}) => {
  try {
    if (!data) {
      const error = new Error("Invalid input data");
      error.statusCode = statusCodes.BAD_REQUEST;
      throw error;
    }
    const updatedRecord = await repository.update(model, id, data, options);
    if (!updatedRecord) {
      const error = new Error("Record not found");
      error.statusCode = statusCodes.NOT_FOUND;
      throw error;
    }
    return updatedRecord;
  } catch (error) {
    throw error;
  }
};

exports.delete = async (model, id, options = {}) => {
  try {
    const deletedRecord = await repository.deleteRecord(model, id, options);
    if (!deletedRecord) {
      const error = new Error("Record not found");
      error.statusCode = statusCodes.NOT_FOUND;
      throw error;
    }
    return deletedRecord;
  } catch (error) {
    throw error;
  }
};
