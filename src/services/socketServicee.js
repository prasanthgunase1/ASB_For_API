const socketIO = require("socket.io");
const redisAdapter = require("@socket.io/redis-adapter");
const { createRedisClient } = require("../config/redisClient");
const { logger } = require("../utils/logger");
const chatAiService = require("../services/chatAiService");
const oktaJwtVerifier = require("../config/oktaConfig");

const REDIS_PREFIX = "dt";
const REQUEST_RESULTS_PREFIX = "request_results:";

const isProd = process.env.NODE_ENV === "production";

/**
 * REQUIRED ENV VARS (AWS)
 *
 * AWS_APP_DOMAIN=https://app.mycompany.com
 * AWS_API_DOMAIN=https://api.mycompany.com
 * PYTHON_API_DOMAIN=https://py-api.mycompany.com
 * OKTA_DOMAIN=https://dev-123456.okta.com
 * ALLOWED_ORIGINS_JSON=["https://app.mycompany.com"]
 */

const {
  AWS_APP_DOMAIN,
  AWS_API_DOMAIN,
  PYTHON_API_DOMAIN,
  OKTA_DOMAIN,
  ALLOWED_ORIGINS_JSON,
} = process.env;

/* -------------------- SAFE ORIGINS -------------------- */
const allowedOrigins = (() => {
  try {
    return JSON.parse(ALLOWED_ORIGINS_JSON || "[]");
  } catch {
    return [];
  }
})();

const devOrigins = isProd
  ? []
  : [
      "http://localhost:3000",
      "http://localhost:5000",
      "http://localhost:4200",
    ];

const pythonOrigins = isProd
  ? [PYTHON_API_DOMAIN]
  : [
      "http://4.188.91.110:8443",
      "http://senseai-python-api.deepthought.svc.cluster.local:8443",
      "https://deepthought-dev.tigeranalytics.com/senseai-py-api",
    ];

const ALL_ALLOWED_ORIGINS = [
  AWS_APP_DOMAIN,
  AWS_API_DOMAIN,
  OKTA_DOMAIN,
  ...allowedOrigins,
  ...pythonOrigins,
  ...devOrigins,
].filter(Boolean);

/* -------------------- SOCKET EVENTS -------------------- */
const SOCKET_EVENTS = {
  JOIN_CONVERSATION: "join-conversation",
  LEAVE_CONVERSATION: "leave-conversation",
  CONVERSATION_MESSAGE: "conversation-message",
  CONVERSATION_STATUS: "conversation-status",
  CONVERSATION_QUEUED: "conversation-queued",
  ERROR_NOTIFICATION: "error-notification",
  CONNECT: "connect",
  DISCONNECT: "disconnect",
};

/* -------------------- SOCKET STATE -------------------- */
const socketState = {
  io: null,
  redisSubscriber: null,
  activeSubscriptions: new Map(),
};

/* -------------------- INITIALIZE SOCKET.IO -------------------- */
function initializeSocketIO(server) {
  if (socketState.io) return socketState;

  socketState.io = socketIO(server, {
    path: "/socket.io/",
    transports: ["websocket", "polling"],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,

    cors: {
      origin(origin, callback) {
        if (!origin) return callback(null, true);

        if (ALL_ALLOWED_ORIGINS.includes(origin)) {
          return callback(null, true);
        }

        if (!isProd) {
          // allow localhost & internal services in dev
          if (
            /^http:\/\/localhost:\d+$/.test(origin) ||
            /^http:\/\/\d+\.\d+\.\d+\.\d+:\d+$/.test(origin)
          ) {
            return callback(null, true);
          }
        }

        logger.warn(`Socket.IO CORS blocked origin: ${origin}`);
        return callback(new Error("Not allowed by Socket.IO CORS"));
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  setupRedisAdapter();
  setupAuthMiddleware();
  setupConnectionHandlers();

  logger.info("✅ Socket.IO initialized (AWS safe)");
  return socketState;
}

/* -------------------- REDIS ADAPTER -------------------- */
async function setupRedisAdapter() {
  try {
    const pubClient = await createRedisClient();
    const subClient = pubClient.duplicate();

    socketState.io.adapter(
      redisAdapter(pubClient, subClient, {
        key: `${REDIS_PREFIX}:socket.io`,
      })
    );

    socketState.redisSubscriber = subClient;
    logger.info("✅ Redis adapter attached to Socket.IO");
  } catch (err) {
    logger.warn(
      "⚠️ Redis adapter failed, running Socket.IO without clustering",
      err.message
    );
  }
}

/* -------------------- OKTA AUTH -------------------- */
function setupAuthMiddleware() {
  socketState.io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      const authHeader = socket.handshake.headers?.authorization;
      if (!token && authHeader?.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }

      if (!token) {
        return next(new Error("Authentication error: No token"));
      }

      const jwt = await oktaJwtVerifier.verifyAccessToken(
        token,
        process.env.OKTA_AUDIENCE
      );

      socket.user = {
        userId: jwt.claims.uid || jwt.claims.sub,
        email: jwt.claims.sub,
        username: jwt.claims.sub,
        groups: jwt.claims.groups || [],
      };

      return next();
    } catch (err) {
      logger.error("Socket auth failed:", err.message);
      return next(new Error("Authentication error"));
    }
  });
}

/* -------------------- CONNECTION HANDLERS -------------------- */
function setupConnectionHandlers() {
  socketState.io.on(SOCKET_EVENTS.CONNECT, (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on(SOCKET_EVENTS.JOIN_CONVERSATION, (conversationId, cb) => {
      const room = `${REDIS_PREFIX}:conversation:${conversationId}`;
      socket.join(room);
      cb?.({ status: "ok" });
    });

    socket.on(SOCKET_EVENTS.LEAVE_CONVERSATION, (conversationId, cb) => {
      const room = `${REDIS_PREFIX}:conversation:${conversationId}`;
      socket.leave(room);
      cb?.({ status: "ok" });
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      logger.info(`Client disconnected: ${socket.id}, ${reason}`);
    });
  });
}

/* -------------------- CLEANUP -------------------- */
async function cleanupSocketIO() {
  if (socketState.io) {
    await new Promise((res) => socketState.io.close(res));
    socketState.io = null;
  }
  if (socketState.redisSubscriber?.isOpen) {
    await socketState.redisSubscriber.quit();
  }
  socketState.activeSubscriptions.clear();
  logger.info("Socket.IO cleaned up");
}

module.exports = {
  initializeSocketIO,
  cleanupSocketIO,
  SOCKET_EVENTS,
};
