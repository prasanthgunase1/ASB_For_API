const statusCodes = require("../utils/statusCodes");
const config = require("../config/config");

module.exports = (req, res, next) => {
  try {
    // Parse the allowed models from the environment variable
    const allowedModelsConfig = config.allowedModels;
    const method = req.method;
    const model = req.params.model;
    const allowedModels = allowedModelsConfig[method];

    if (!allowedModels || !allowedModels.includes(model)) {
      const errorMessage = "Operation not allowed for this model";
      const error = new Error(errorMessage);
      error.statusCode = statusCodes.NOT_FOUND;
      return next(error);
    }
    next();
  } catch (err) {
    next(err);
  }
};
