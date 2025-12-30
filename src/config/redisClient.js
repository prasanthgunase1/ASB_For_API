const { redisConfig } = require("./config");
const { createClient } = require("redis");
const { logger } = require("../utils/logger");

/**
 * Create a Redis client for:
 * - Socket.IO adapter
 * - Pub/Sub
 * - General Redis operations
 *
 * Compatible with:
 * - AWS ElastiCache
 * - AWS MemoryDB
 * - Docker / self-hosted Redis
 */
const createRedisClient = async () => {
  try {
    // Build connection config (cloud-agnostic)
    const connectionConfig = {
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
        tls: redisConfig.enableTLS || false,
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

    // Extra debug logs for non-production environments
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

/**
 * Redis connection config for BullMQ (queues/workers)
 * Works with AWS ElastiCache / MemoryDB
 */
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
