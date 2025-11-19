// middlewares/validate.js
const { checkSchema, validationResult } = require("express-validator");
const modelSchemas = require("../schemas");

const validate = (validationKey, options = {}) => {
  return async (req, res, next) => {
    // 1. Simplified model resolution
    const model = options.model ? options.model : req.params.model;
    if (!model) return next();

    // 2. Get validationKey-specific schema
    const schema = modelSchemas[model];
    if (!schema) return next();

    const validationSchema = schema[validationKey];
    if (!validationSchema) return next();

    // 3. validate schema
    await checkSchema(validationSchema).run(req);

    // 4. Enhanced error handling
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationError = new Error("Validation failed");
      validationError.name = "ValidationError";
      validationError.statusCode = 400;
      validationError.errors = errors.mapped();
      return next(validationError);
    }
    next();
  };
};

module.exports = validate;
