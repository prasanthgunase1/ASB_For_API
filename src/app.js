require("dotenv").config({ path: `${__dirname}/../.env` });
const express = require("express");
const { createServer } = require("http");
const cors = require("cors");
const userRouter = require("./routes/userRoute");
const crudRouter = require("./routes/crudRoute");
const agentRouter = require("./routes/agentRoute");
const mediaRouter = require("./routes/mediaRoute");
const threadRoutes = require("./routes/threadRoute");
const dashboardRouter = require("./routes/dashboardRoute");
const artifactsRoute = require('./routes/artifactsRoute');
const adminRoutes = require("./routes/adminRoute");
const conversationRoutes = require("./routes/feedbackRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes.js"); 
const PORT = process.env.PORT || 3000;
const sequelize = require("./config/database"); // Import the Sequelize instance
const { logger, httpLogger } = require("./utils/logger");
const dataRoute = require("./routes/dataRoute");
const {
  initializeSocketIO,
  cleanupSocketIO,
} = require("./services/socketService");
const { keycloak } = require("./config/keycloak");
const helmetConfig = require("./config/helmetConfig");
const errorHandler = require("./utils/errorHandler"); // Import the error handler
const { extractUserFromToken } = require("./middlewares/authMiddleware"); // Import the middleware

const app = express();
const server = createServer(app);

console.log("Environment:", process.env.NODE_ENV);
let allowedOrigins = [];
try {
  allowedOrigins = JSON.parse(process.env.ALLOWED_ORIGINS);
} catch (e) {
  allowedOrigins = [];
}

app.use(
  cors({
    origin: (origin, callback) => {
      try {
        console.log("CORS check for origin:", origin);

        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) {
          return callback(null, true);
        }

        // Parse ALLOWED_ORIGINS from environment
        let allowedOriginsFromEnv = [];
        try {
          allowedOriginsFromEnv = JSON.parse(
            process.env.ALLOWED_ORIGINS || "[]"
          );
        } catch (error) {
          console.error("Error parsing ALLOWED_ORIGINS:", error);
          allowedOriginsFromEnv = [];
        }

        const productionOrigins = [
          "http://localhost:3000",
          "http://localhost:5000",
          "http://localhost:5173",
          "https://deepthought-dev.tigeranalytics.com",
          "https://deepthought-dev.tigeranalytics.com/senseai",
          "https://deepthought.tigeranalyticstest.in",
          "https://deepthought.tigeranalyticstest.in/senseai",
          "https://deepthought.tigeranalyticstest.in/senseai-api",
          "http://4.188.91.110:8443",
          "http://senseai-python-api.deepthought.svc.cluster.local:8443",
          "https://deepthought-dev.tigeranalytics.com/senseai-py-api",
          ...allowedOriginsFromEnv,
        ];

        // Remove duplicates
        const uniqueOrigins = [...new Set(productionOrigins)];

        // Check exact matches first
        if (uniqueOrigins.includes(origin) || uniqueOrigins.includes("*")) {
          console.log("Express CORS: Allowed origin:", origin);
          return callback(null, true);
        }

        // Check wildcard patterns for Azure services + Python APIs
        const azurePatterns = [
          /^https:\/\/.*\.powerbi\.com$/,
          /^https:\/\/.*\.microstrategy\.com$/,
          /^https:\/\/.*\.microsoftonline\.com$/,
          /^https:\/\/.*\.azurewebsites\.net$/,
          /^https:\/\/.*\.blob\.core\.windows\.net$/,
          /^https:\/\/.*\.analysis\.windows\.net$/,
          /^http:\/\/localhost:\d+$/,
          /^https:\/\/.*\.tigeranalytics\.com$/,
          /^https:\/\/.*\.tigeranalyticstest\.in$/,
          /^https:\/\/deepthought\.tigeranalyticstest\.in.*$/,
          /^http:\/\/4\.188\.91\.110:\d+$/,
          /^http:\/\/.*\.deepthought\.svc\.cluster\.local:\d+$/,
        ];

        if (azurePatterns.some((pattern) => pattern.test(origin))) {
          console.log("Express CORS: Allowed Azure/Python pattern:", origin);
          return callback(null, true);
        }

        console.warn(`Express CORS blocked origin: ${origin}`);
        callback(null, false);
      } catch (error) {
        console.error("CORS error:", error);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Content-Length",
      "X-Azure-Ref",
      "Cache-Control",
      "Pragma",
      "Connection",
      "Upgrade",
      "Sec-WebSocket-Key",
      "Sec-WebSocket-Version",
      "Sec-WebSocket-Extensions",
      "Sec-WebSocket-Protocol",
    ],
    exposedHeaders: ["Content-Disposition", "Access-Control-Allow-Credentials"],
    maxAge: 86400,
  })
);

app.use(helmetConfig);
// Middleware to conditionally apply express.json()
const jsonMiddleware = (req, res, next) => {
  if (req.path !== "/api/message" && req.path !== "/api/agent/callback") {
    express.json()(req, res, next);
  } else {
    next();
  }
};
app.use(express.json());
app.use(jsonMiddleware);
app.use(keycloak.middleware());
app.use(extractUserFromToken);

// Initialize database
sequelize
  .sync()
  .then(() => logger.info("Database synced"))
  .catch((err) => logger.error("Database sync failed:", err));

app.use(httpLogger);

//register routes
app.use("/api/user", userRouter);
app.use("/api/agent", agentRouter);
app.use("/api/media", mediaRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/data", dataRoute);
app.use("/api/threads", threadRoutes);
app.use("/api/admin",adminRoutes);
app.use("/api/conversation", conversationRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use('/api/artifacts', artifactsRoute);
app.use("/api", crudRouter);

 //this is a dynamic route so put it after all the routes you created

// Register the global error handler (must be after all other middleware and routes)
app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("API is running... Deployment: 11 June");
});

/**
 * Configures graceful shutdown for Azure environments
 * @param {http.Server} server - The HTTP server instance to shut down
 */
function setupShutdownHandlers(server) {
  // Azure-optimized graceful shutdown handlers
  const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received - starting graceful shutdown`);

    // Close Socket.IO and Redis connections first
    try {
      await cleanupSocketIO();
      logger.info("Socket.IO connections closed");
    } catch (err) {
      logger.error("Error closing Socket.IO connections:", err);
    }

    // Close HTTP server with timeout
    const closeServer = new Promise((resolve) => {
      server.close(() => {
        logger.info("HTTP server closed");
        resolve();
      });

      // Force close after 15 seconds (Azure gives 30s shutdown window)
      setTimeout(() => {
        logger.warn("Force closing HTTP server after timeout");
        resolve();
      }, 15000);
    });

    await closeServer;

    // Close database connections
    try {
      await sequelize.close();
      logger.info("Database connections closed");
    } catch (dbError) {
      logger.error("Error closing database:", dbError);
    }

    logger.info("Shutdown completed");
    process.exit(0);
  };

  // Register shutdown handlers
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM")); // Azure sends SIGTERM
  process.on("SIGINT", () => gracefulShutdown("SIGINT")); // Ctrl+C locally
}

/**
 * Starts the server with proper async initialization
 * @returns {Promise<http.Server>} The server instance
 */
async function startServer() {
  try {
    // Initialize WebSocket with proper await
    const socketServices = await initializeSocketIO(server, keycloak);
    app.set("socket", socketServices); // Make available to controllers

    // Start the server
    const serverInstance = server.listen(PORT, () => {
      console.log(`Server running with WebSocket on port ${PORT}`);
      logger.info(`Server started on port ${PORT} with WebSocket support`);
    });

    // Set up shutdown handlers
    setupShutdownHandlers(serverInstance);

    return serverInstance;
  } catch (err) {
    console.error("Failed to start server:", err);
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
}

// Start the server asynchronously
const serverInstance = startServer();

// Handle unhandled rejections and exceptions
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection at:", promise, "reason:", reason);
  // Log but don't exit for unhandled promise rejections
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  // For uncaught exceptions, begin shutdown process
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

module.exports = { app, server: serverInstance };
