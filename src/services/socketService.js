const socketIO = require("socket.io");
const redisAdapter = require("@socket.io/redis-adapter");
const { createRedisClient } = require("../config/redisClient");
const repository = require("../data/crudRepository");
const { logger } = require("../utils/logger");
const chatAiService = require("../services/chatAiService");
const oktaJwtVerifier = require("../config/oktaConfig"); // ✅ Okta verifier

const REDIS_PREFIX = "dt";
const REQUEST_RESULTS_PREFIX = "request_results:";
const SOCKET_EVENTS = {
  JOIN_CONVERSATION: "join-conversation",
  LEAVE_CONVERSATION: "leave-conversation",
  CONVERSATION_MESSAGE: "conversation-message",
  CONVERSATION_STATUS: "conversation-status",
  CONVERSATION_QUEUED: "conversation-queued",
  NOTIFICATION: "notification",
  ERROR_NOTIFICATION: "error-notification",
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  CONNECT_ERROR: "connect_error",
};

const socketState = {
  io: null,
  sendResponse: null,
  subscribeToRequestResults: null,
  unsubscribeFromRequestResults: null,
  redisSubscriber: null,
  activeSubscriptions: new Map(), // key: AI message ID, value: { conversationId, userId, taskIdUUID }
};

socketState.unsubscribeFromRequestResults = async (aiMessageId) => {
  if (!socketState.redisSubscriber?.isOpen) return;

  const channel = REQUEST_RESULTS_PREFIX + aiMessageId;
  try {
    await socketState.redisSubscriber.unsubscribe(channel);
    socketState.activeSubscriptions.delete(String(aiMessageId));
    logger.info(`Unsubscribed from Redis channel: ${channel}`);
  } catch (error) {
    logger.error(`Error unsubscribing from ${channel}: ${error.message}`);
    socketState.activeSubscriptions.delete(String(aiMessageId));
  }
};

async function setupRequestResultsRedisSubscription(client) {
  socketState.redisSubscriber = client;

  try {
    logger.info(`Redis client class: ${client.constructor.name}`);
    logger.info(
      `Redis client version: ${require("redis/package.json").version}`
    );

    logger.debug(
      `Client has subscribe method: ${typeof client.subscribe === "function"}`
    );
    logger.debug(
      `Client has pSubscribe method: ${typeof client.pSubscribe === "function"}`
    );

    try {
      await client.unsubscribe();
    } catch (err) {
      // ignore
    }

    const messageHandler = (message, channel) => {
      try {
        logger.info(
          `[REDIS MSG] Channel: ${channel}, Raw message: ${message.substring(
            0,
            100
          )}${message.length > 100 ? "..." : ""}`
        );

        if (channel.startsWith(REQUEST_RESULTS_PREFIX)) {
          const questionId = channel.slice(REQUEST_RESULTS_PREFIX.length);
          try {
            const update = JSON.parse(message);
            logger.info(
              `[REDIS MSG] Parsed message for ${questionId}: ${JSON.stringify(
                update
              ).substring(0, 100)}...`
            );
            setImmediate(() => handleRequestResultUpdate(questionId, update));
          } catch (parseError) {
            logger.error(`Invalid JSON on ${channel}: ${parseError.message}`, {
              rawMessage: message.substring(0, 200),
              error: parseError,
            });
          }
        }
      } catch (error) {
        logger.error(`Error processing Redis message: ${error.message}`, {
          channel,
          error,
        });
      }
    };

    await client.subscribe(REQUEST_RESULTS_PREFIX + "*", messageHandler);

    if (typeof client.pSubscribe === "function") {
      try {
        await client.pSubscribe(REQUEST_RESULTS_PREFIX + "*", messageHandler);
        logger.info("Pattern subscription successful");
      } catch (patternError) {
        logger.warn(
          `Pattern subscription failed: ${patternError.message}, continuing with regular subscription`
        );
      }
    }

    logger.info(`Subscribed to Redis channels: ${REQUEST_RESULTS_PREFIX}*`);
    return client;
  } catch (error) {
    logger.error(`Error setting up Redis subscription: ${error.message}`, {
      stack: error.stack,
      code: error.code || "unknown",
    });

    try {
      logger.info("Trying alternative Redis subscription approach...");

      const messageListener = (channel, message) => {
        logger.info(`[REDIS EVENT] Message on ${channel}`);
        if (channel.startsWith(REQUEST_RESULTS_PREFIX)) {
          const questionId = channel.slice(REQUEST_RESULTS_PREFIX.length);
          try {
            const update = JSON.parse(message);
            handleRequestResultUpdate(questionId, update);
          } catch (e) {
            logger.error(`Invalid JSON in event handler: ${e.message}`);
          }
        }
      };

      client.on("message", messageListener);

      await client.subscribe(REQUEST_RESULTS_PREFIX + "*");
      logger.info("Fallback subscription approach successful");
      return client;
    } catch (fallbackError) {
      logger.error(
        `Fallback subscription also failed: ${fallbackError.message}`
      );
      throw error;
    }
  }
}

async function handleRequestResultUpdate(aiMessageId, update) {
  logger.info(
    `[SOCKET DEBUG] Processing Redis update for ${aiMessageId}: ${JSON.stringify(
      update
    ).substring(0, 100)}...`
  );

  const lookupKey = String(aiMessageId);

  try {
    const subscription = socketState.activeSubscriptions.get(lookupKey);
    if (!subscription) {
      logger.warn(
        `[SOCKET DEBUG] No subscription found for message ${aiMessageId}`
      );

      if (update.status === "completed" || update.status === "complete") {
        const allRooms = Array.from(
          socketState.io.sockets.adapter.rooms.keys()
        );
        const conversationRooms = allRooms.filter((room) =>
          room.startsWith(`${REDIS_PREFIX}:conversation:`)
        );

        conversationRooms.forEach((room) => {
          const conversationId = room.split(":conversation:")[1];
          if (conversationId) {
            const payload = {
              type: "conversation-message",
              conversation_id: conversationId,
              message_id: aiMessageId,
              content:
                update.result?.insight ||
                JSON.stringify(update.result || update),
              status: "completed",
              metadata: {
                status: "completed",
                agent_response: update,
                completed_via: "emergency_fix",
                completed_at: new Date().toISOString(),
              },
              sender_type: "chatai",
              files: update.result?.files || [],
              timestamp: Date.now(),
            };

            socketState.io
              .to(room)
              .emit(SOCKET_EVENTS.CONVERSATION_STATUS, payload);
            socketState.io
              .to(room)
              .emit(SOCKET_EVENTS.CONVERSATION_MESSAGE, payload);
          }
        });
      }

      return;
    }

    const { conversationId, userId, taskIdUUID } = subscription;
    const room = `${REDIS_PREFIX}:conversation:${conversationId}`;
    const io = socketState.io;

    if (!io) {
      logger.error(`[SOCKET DEBUG] Socket.IO not initialized`);
      return;
    }

    const messageStatus = (update.status || "").toUpperCase();
    let content = update.result ?? update.message ?? "";
    if (typeof content === "object") content = JSON.stringify(content);

    const metadataUpdate = {
      status: messageStatus.toLowerCase(),
      agent_response: update,
      task_id: taskIdUUID,
      updated_via: "redis_callback",
      updated_at: new Date().toISOString(),
    };
    if (update.request_id) metadataUpdate.request_id = update.request_id;

    let updatedMsg;
    try {
      updatedMsg = await chatAiService.updateChatMessage(
        aiMessageId,
        content,
        metadataUpdate,
        { context: { user: { username: userId } }, systemUpdate: true }
      );
    } catch (updateError) {
      logger.error(
        `[SOCKET DEBUG] Failed to update chat message ${aiMessageId}: ${updateError.message}`
      );
    }

    if (taskIdUUID) {
      try {
        await chatAiService.updateTaskStatus(
          taskIdUUID,
          messageStatus,
          update.result ?? update.message
        );
      } catch (taskError) {
        logger.warn(
          `[SOCKET DEBUG] Non-critical task update error for ${taskIdUUID}: ${taskError.message}`
        );
      }
    }

    const payload = {
      type: SOCKET_EVENTS.CONVERSATION_STATUS,
      conversation_id: String(conversationId),
      message_id: String(aiMessageId),
      content,
      status: messageStatus,
      metadata: updatedMsg?.metadata,
      sender_type: "chatai",
      task_id: taskIdUUID,
      timestamp: Date.now(),
    };

    if (["COMPLETED", "COMPLETE"].includes(messageStatus)) {
      try {
        io.to(room).emit(SOCKET_EVENTS.CONVERSATION_STATUS, {
          ...payload,
          queue_management: "check_running_queue",
        });

        io.to(room).emit(SOCKET_EVENTS.CONVERSATION_MESSAGE, {
          ...payload,
          queue_management: "check_running_queue",
        });
      } catch (emitError) {
        logger.error(
          `[SOCKET DEBUG] Error emitting completion events: ${emitError.message}`
        );
      }
    } else if (messageStatus === "QUEUED") {
      io.to(room).emit(SOCKET_EVENTS.CONVERSATION_QUEUED, payload);
    } else {
      io.to(room).emit(SOCKET_EVENTS.CONVERSATION_STATUS, payload);
    }

    const finalStatuses = [
      "COMPLETED",
      "COMPLETE",
      "ERROR",
      "FAILED",
      "CANCELLED",
    ];
    if (finalStatuses.includes(messageStatus)) {
      logger.info(
        `Final status ${messageStatus} received, unsubscribing from Redis channel`
      );
      await socketState.unsubscribeFromRequestResults(String(aiMessageId));
      socketState.activeSubscriptions.delete(String(aiMessageId));
    } else {
      logger.info(
        `Intermediate status ${messageStatus} received, maintaining subscription`
      );
    }
  } catch (error) {
    logger.error(
      `[SOCKET DEBUG] Error in handleRequestResultUpdate for ${aiMessageId}: ${error.message}`,
      { error, update }
    );

    try {
      const room = `${REDIS_PREFIX}:conversation:${
        socketState.activeSubscriptions.get(String(aiMessageId))?.conversationId
      }`;
      if (room && socketState.io) {
        socketState.io.to(room).emit(SOCKET_EVENTS.ERROR_NOTIFICATION, {
          conversation_id: String(
            socketState.activeSubscriptions.get(String(aiMessageId))
              ?.conversationId
          ),
          message_id: String(aiMessageId),
          task_id: socketState.activeSubscriptions.get(String(aiMessageId))
            ?.taskIdUUID,
          error: "Internal Server Error",
          details: error.message,
          timestamp: Date.now(),
        });
      }
    } catch (emitError) {
      logger.error(
        `[SOCKET DEBUG] Failed to emit error notification: ${emitError.message}`
      );
    }
  }
}

/**
 * Initialize Socket.IO with Okta auth (no Keycloak).
 */
function initializeSocketIO(server) {
  if (socketState.io) {
    logger.warn("Socket.IO already initialized");
    return Promise.resolve(socketState);
  }

  socketState.io = socketIO(server, {
    cors: {
      origin: (origin, callback) => {
        let allowed = [];
        try {
          allowed = JSON.parse(process.env.ALLOWED_ORIGINS || "[]");
        } catch (error) {
          console.error("Error parsing ALLOWED_ORIGINS:", error);
          allowed = [];
        }

        const frontendDomains = [
          "http://localhost:3000",
          "http://localhost:5000",
          "https://deepthought.tigeranalyticstest.in",
          "https://deepthought.tigeranalyticstest.in/senseai",
          "https://deepthought.tigeranalyticstest.in/senseai-api",
          "https://deepthought-dev.tigeranalytics.com",
          "https://deepthought-dev.tigeranalytics.com/senseai",
          "https://deepthought-dev.tigeranalytics.com/senseai-api",
          "http://4.188.91.110:8443",
          "http://senseai-python-api.deepthought.svc.cluster.local:8443",
          "https://deepthought-dev.tigeranalytics.com/senseai-py-api",
        ];

        const allAllowed = [...new Set([...allowed, ...frontendDomains])];

        if (!origin) {
          return callback(null, true);
        }

        if (allAllowed.includes(origin) || allAllowed.includes("*")) {
          console.log("Socket.IO CORS: Allowed origin:", origin);
          return callback(null, true);
        } else {
          const azurePatterns = [
            /^http:\/\/localhost:\d+$/,
            /^https:\/\/.*\.tigeranalytics\.com$/,
            /^https:\/\/.*\.azurewebsites\.net$/,
            /^https:\/\/.*\.tigeranalyticstest\.in$/,
            /^https:\/\/deepthought\.tigeranalyticstest\.in\/.*$/,
            /^https:\/\/.*\.powerbi\.com$/,
            /^https:\/\/.*\.microstrategy\.com$/,
            /^https:\/\/.*\.microsoftonline\.com$/,
            /^https:\/\/.*\.windows\.net$/,
            /^http:\/\/4\.188\.91\.110:\d+$/,
            /^http:\/\/.*\.deepthought\.svc\.cluster\.local:\d+$/,
          ];

          if (azurePatterns.some((pattern) => pattern.test(origin))) {
            console.log(
              "Socket.IO CORS: Allowed Azure/Python pattern:",
              origin
            );
            callback(null, true);
          } else {
            console.warn(`Socket.IO CORS blocked origin: ${origin}`);
            callback(new Error("Not allowed by Socket.IO CORS"));
          }
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Cache-Control",
        "Pragma",
        "Connection",
        "Upgrade",
        "Sec-WebSocket-Key",
        "Sec-WebSocket-Version",
        "Sec-WebSocket-Extensions",
        "Sec-WebSocket-Protocol",
      ],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    path: "/socket.io/",
    transports: ["polling", "websocket"],
    allowEIO3: true,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e8,
    allowRequest: (req, callback) => {
      console.log(
        "Socket.IO connection attempt from:",
        req.headers.origin || req.headers.host
      );
      callback(null, true);
    },
  });

  async function setup() {
    try {
      const pubClient = await createRedisClient();
      const subClient = await createRedisClient();

      socketState.io.adapter(
        redisAdapter(pubClient, subClient.duplicate(), {
          key: `${REDIS_PREFIX}:socket.io`,
          requestsTimeout: 5000,
        })
      );

      await setupRequestResultsRedisSubscription(subClient);

      setupAuthMiddleware();   // ✅ Okta-based auth
      setupConnectionHandlers();
      setupHelperFunctions();

      logger.info("Socket.IO initialized successfully");
      return socketState;
    } catch (error) {
      logger.error(`Failed to set up Redis adapter: ${error.message}`);
      logger.warn(
        "Socket.IO will operate without Redis adapter (no horizontal scaling)"
      );

      setupAuthMiddleware();   // still enforce Okta auth
      setupConnectionHandlers();
      setupHelperFunctions();

      logger.info("Socket.IO initialized without Redis adapter");
      return socketState;
    }
  }

  return setup();
}

/**
 * Socket.IO auth middleware using Okta.
 * Expects token from: socket.handshake.auth.token OR Authorization header.
 */
function setupAuthMiddleware() {
  socketState.io.use(async (socket, next) => {
    try {
      // Prefer auth.token, fallback to Authorization header
      let token = socket.handshake.auth?.token;

      const authHeader = socket.handshake.headers?.authorization;
      if (!token && authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }

      if (!token) {
        logger.warn("Socket connection attempted without token");
        return next(new Error("Authentication error: No token provided"));
      }

      logger.info(
        `Socket auth attempt with token (first 20 chars): ${token.substring(
          0,
          20
        )}...`
      );

      // ✅ Verify using Okta
      const jwt = await oktaJwtVerifier.verifyAccessToken(
        token,
        process.env.OKTA_AUDIENCE
      );

      socket.user = {
        userId: jwt.claims.uid || jwt.claims.sub,
        email: jwt.claims.sub,
        username: jwt.claims.sub,
        name: jwt.claims.name || "",
        groups: jwt.claims.groups || [],
      };

      logger.info(
        `Socket authenticated successfully for user: ${socket.user.username}`
      );
      return next();
    } catch (err) {
      logger.error(`Socket authentication failed: ${err.message}`);
      return next(new Error("Authentication error: Invalid or expired token"));
    }
  });
}

function setupConnectionHandlers() {
  socketState.io.on(SOCKET_EVENTS.CONNECT, (socket) => {
    logger.info(`Client connected: ${socket.id}`);
    socket.on(SOCKET_EVENTS.JOIN_CONVERSATION, async (conversationId, cb) => {
      try {
        const room = `${REDIS_PREFIX}:conversation:${conversationId}`;
        socket.join(room);
        const roomSize =
          socketState.io.sockets.adapter.rooms.get(room)?.size || 0;
        cb?.({ status: "ok", roomSize });
      } catch (e) {
        logger.error("Join conversation error:", e.message);
        cb?.({ status: "error", message: e.message });
      }
    });
    socket.on(SOCKET_EVENTS.LEAVE_CONVERSATION, (conversationId, cb) => {
      const room = `${REDIS_PREFIX}:conversation:${conversationId}`;
      socket.leave(room);
      logger.info(`Socket ${socket.id} left room ${room}`);
      cb?.({ status: "ok" });
    });
    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });
    socket.on("error", (err) => {
      logger.error(`Socket error for ${socket.id}: ${err.message}`);
    });
  });
}

function setupHelperFunctions() {
  socketState.sendResponse = (userId, conversationId, payload) => {
    if (!socketState.io) {
      logger.error("Socket.IO not initialized");
      return;
    }

    let evt = SOCKET_EVENTS.CONVERSATION_MESSAGE;

    if (payload.status?.toLowerCase() === "queued")
      evt = SOCKET_EVENTS.CONVERSATION_QUEUED;
    else if (
      payload.status &&
      !["complete", "completed"].includes(payload.status.toLowerCase())
    )
      evt = SOCKET_EVENTS.CONVERSATION_STATUS;
    else if (payload.error) evt = SOCKET_EVENTS.ERROR_NOTIFICATION;

    const room = `${REDIS_PREFIX}:conversation:${conversationId}`;
    const roomSize = socketState.io.sockets.adapter.rooms.get(room)?.size || 0;

    socketState.io.to(room).emit(evt, payload);
  };

  socketState.subscribeToRequestResults = async (
    aiMessageId,
    conversationId,
    userId,
    taskIdUUID
  ) => {
    if (!socketState.redisSubscriber?.isOpen) {
      throw new Error("Redis subscriber not ready");
    }
    const channel = REQUEST_RESULTS_PREFIX + aiMessageId;

    try {
      const subscriptionKey = String(aiMessageId);
      socketState.activeSubscriptions.set(subscriptionKey, {
        conversationId,
        userId,
        taskIdUUID,
      });

      const messageHandler = (message) => {
        try {
          logger.info(
            `[DIRECT] Received message on ${channel} for message ID ${aiMessageId}`
          );
          const update = JSON.parse(message);
          handleRequestResultUpdate(aiMessageId, update);
        } catch (error) {
          logger.error(
            `Error processing direct message on ${channel}: ${error.message}`
          );
        }
      };

      await socketState.redisSubscriber.subscribe(channel, messageHandler);

      logger.info(
        `Subscribed to Redis channel: ${channel} for task ${taskIdUUID}`
      );
    } catch (error) {
      logger.error(`Error subscribing to channel ${channel}: ${error.message}`);
      socketState.activeSubscriptions.delete(String(aiMessageId));
      throw error;
    }
  };
}

async function cleanupSocketIO() {
  const tasks = [];
  if (socketState.io) {
    tasks.push(new Promise((res) => socketState.io.close(res)));
    socketState.io = null;
  }
  if (socketState.redisSubscriber?.isOpen) {
    tasks.push(socketState.redisSubscriber.quit().catch(() => {}));
    socketState.redisSubscriber = null;
  }
  socketState.activeSubscriptions.clear();
  await Promise.allSettled(tasks);
  logger.info("Socket.IO and Redis subscribers cleaned up");
}

module.exports = {
  initializeSocketIO,
  getSendResponse: () => socketState.sendResponse,
  cleanupSocketIO,
  getSubscribeToRequestResults: () => socketState.subscribeToRequestResults,
  getUnsubscribeFromRequestResults: () =>
    socketState.unsubscribeFromRequestResults,
  SOCKET_EVENTS,
  _socketState: process.env.NODE_ENV === "test" ? socketState : undefined,
};
