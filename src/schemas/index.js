// schemas/index.js
const fs = require("fs");
const path = require("path");
const { logger } = require("../utils/logger");

const schemas = {};

try {
  fs.readdirSync(__dirname)
    .filter((file) => file.endsWith(".schema.js")) // load only .schema.js convention files
    .forEach((file) => {
      try {
        const modelName = file.replace(/\.schema\.js$/i, "").toLowerCase();
        schemas[modelName] = require(path.join(__dirname, file));
      } catch (err) {
        logger.error(`[Schema Loader] Failed to load ${file}: ${err.message}`);
      }
    });
} catch (err) {
  logger.error(`[Schema Loader] Failed to read schemas directory: ${err.message}`);
}

module.exports = schemas;