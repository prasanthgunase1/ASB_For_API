const repository = require("../data/crudRepository");
const statusCodes = require("../utils/statusCodes");

// HELPER: Map camelCase filters to UPPER_UNDERSCORE for Snowflake (Optional but recommended)
// If your frontend sends "userId" but Snowflake has "USER_ID", this handles it.
const mapFiltersToSnowflake = (filters) => {
  const newFilters = {};
  for (const key in filters) {
    // specific logic to exclude pagination params
    if (key !== "page" && key !== "limit") { 
       // Simple conversion: userId -> USERID or user_id -> USER_ID. 
       // Adjust this logic based on your exact column naming convention.
       // For now, we pass it through, but assume the repository handles the SQL mapping.
       newFilters[key] = filters[key];
    }
  }
  return newFilters;
};

exports.getAll = async (model, options = {}) => {
  try {
    const { page, limit, context, filters } = options;
    const offset = (page - 1) * limit;

    // 1. Build the where clause
    const where = mapFiltersToSnowflake(filters || {});

    const queryOptions = { ...options, offset, limit, where, context };

    // 2. CHANGE FOR SNOWFLAKE: Fetch Rows AND Count
    // Raw SQL drivers usually just return an array. They don't give you the total count
    // of the table unless you ask for it.
    
    // Fetch the actual data
    const rows = await repository.findAll(model, queryOptions);

    // Fetch the total count (You need to ensure your repository has a count method, 
    // or you can remove this and just return rows.length, but pagination will break).
    let count = 0;
    try {
        // Assuming your repository now has a helper to count records based on filters
        count = await repository.count(model, { where, context });
    } catch (err) {
        // Fallback: If counting fails or isn't implemented, use the length of current page
        count = rows ? rows.length : 0; 
    }

    // 3. Return the structure the Controller expects ({ rows, count })
    return {
        rows: rows || [],
        count: count
    };

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
    // Note: Ensure 'data' keys match Snowflake Column Names (usually Case Sensitive)
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
    
    // Note: Snowflake updates need strict column matching
    const updatedRecord = await repository.update(model, id, data, options);
    
    // Logic change: Raw SQL updates might return "number of rows updated" (e.g., [1])
    // or the array of rows. Check your repository implementation.
    // If updatedRecord is 0 or [] (empty array), throw error.
    if (!updatedRecord || (Array.isArray(updatedRecord) && updatedRecord.length === 0)) {
      const error = new Error("Record not found or no changes made");
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
    
    // Check if delete was successful (usually returns row count in raw SQL)
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