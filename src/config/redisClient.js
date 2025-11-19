const { redisConfig } = require("./config");
const { createClient } = require("redis");
const { logger } = require("../utils/logger");

// For regular Redis operations (Socket.IO, tracking client, etc)
const createRedisClient = async () => {
  try {
    // Build connection config for Azure Redis Cache
    const connectionConfig = {
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
        tls: redisConfig.enableTLS,
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
      },
      password: redisConfig.password,
      database: 0,
    };

    const client = createClient(connectionConfig);

    client.on("error", (err) => {
      logger.error(`Redis client error: ${err.message}`);
    });

    client.on("reconnecting", () => {
      logger.info("Redis client reconnecting");
    });

    client.on("connect", () => {
      logger.info("Redis client connected");
    });

    client.on("ready", () => {
      logger.info("Redis client ready");
    });

    client.on("end", () => {
      logger.warn("Redis client connection closed");
    });

    // Add more debug-focused handlers during development
    if (process.env.NODE_ENV !== "production") {
      client.on("message", (channel, message) => {
        logger.debug(
          `[REDIS DEBUG] Message on channel ${channel}: ${message.substring(
            0,
            50
          )}...`
        );
      });

      client.on("subscribe", (channel) => {
        logger.debug(`[REDIS DEBUG] Subscribed to channel: ${channel}`);
      });
    }

    await client.connect();
    return client;
  } catch (error) {
    logger.error(`Error creating Redis client: ${error.message}`);
    throw error;
  }
};

// For BullMQ (Worker/Queue) - Returns a connection configuration object
function createBullMQConnection() {
  return {
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password,
    tls: redisConfig.enableTLS ? {} : undefined,
  };
}

module.exports = {
  createRedisClient,
  createBullMQConnection,
  redisConfig,
};
