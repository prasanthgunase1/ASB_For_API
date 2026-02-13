// schemas/index.js
const fs = require("fs");
const path = require("path");
const { logger } = require("../utils/logger");

const schemas = {};

try {
  fs.readdirSync(__dirname)
    .filter((file) => file.endsWith(".schema.js")) // Loads files like 'conversation.schema.js'
    .forEach((file) => {
      try {
        // Normalizes 'Conversation.schema.js' -> 'conversation'
        const modelName = file.replace(/\.schema\.js$/i, "").toLowerCase();
        schemas[modelName] = require(path.join(__dirname, file));
        // Optional: Debug log to confirm what loaded
        // logger.info(`[Schema Loader] Loaded validation schema: ${modelName}`);
      } catch (err) {
        logger.error(`[Schema Loader] Failed to load ${file}: ${err.message}`);
      }
    });
} catch (err) {
  logger.error(`[Schema Loader] Failed to read schemas directory: ${err.message}`);
}

module.exports = schemas;