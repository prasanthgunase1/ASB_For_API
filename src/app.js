require("dotenv").config({ path: `${__dirname}/../.env` });
const express = require("express");
const { createServer } = require("http");
const cors = require("cors");

// Routes
const userRouter = require("./routes/userRoute");
const crudRouter = require("./routes/crudRoute");
const agentRouter = require("./routes/agentRoute");
const mediaRouter = require("./routes/mediaRoute");
const threadRoutes = require("./routes/threadRoute");
const dashboardRouter = require("./routes/dashboardRoute");
const artifactsRoute = require("./routes/artifactsRoute");
const adminRoutes = require("./routes/adminRoute");
const conversationRoutes = require("./routes/feedbackRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes.js");
const dataRoute = require("./routes/dataRoute");
const fileRoute = require("./routes/fileRoute");

// Config & Utils
const PORT = process.env.PORT || 3000;
const sequelize = require("./config/database");
const { logger, httpLogger } = require("./utils/logger");
const { initializeSocketIO, cleanupSocketIO } = require("./services/socketService");
const helmetConfig = require("./config/helmetConfig");
const errorHandler = require("./utils/errorHandler");

// NEW: secure Postgres init (uses AWS Secrets Manager inside ./db/postgresClient)
// const { initPostgres } = require("./db/postgresClient");

// CHANGED: Okta Middleware
const { extractUserFromToken } = require("./middlewares/authMiddleware");

const app = express();
const server = createServer(app);

console.log("Environment:", process.env.NODE_ENV);

// --- CORS Configuration (Updated for AWS) ---
app.use(
  cors({
    origin: (origin, callback) => {
      try {
        if (!origin) return callback(null, true);

        let allowedOriginsFromEnv = [];
        try {
          allowedOriginsFromEnv = JSON.parse(process.env.ALLOWED_ORIGINS || "[]");
        } catch (error) {
          allowedOriginsFromEnv = [];
        }

        const productionOrigins = [
          "http://localhost:3000",
          "http://localhost:5000",
          "http://localhost:5173",
          ...allowedOriginsFromEnv,
        ];

        const uniqueOrigins = [...new Set(productionOrigins)];

        // Exact match
        if (uniqueOrigins.includes(origin) || uniqueOrigins.includes("*")) {
          return callback(null, true);
        }

        // AWS & General Patterns
        const allowedPatterns = [
          /^https:\/\/.*\.amazonaws\.com$/,           // AWS S3/CloudFront
          /^https:\/\/.*\.elasticbeanstalk\.com$/,    // AWS Elastic Beanstalk
          /^http:\/\/localhost:\d+$/,                 // Localhost
          /^https:\/\/.*\.tigeranalytics\.com$/,      // Your domain
        ];

        if (allowedPatterns.some((pattern) => pattern.test(origin))) {
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
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  })
);

app.use(helmetConfig);

// JSON Middleware
const jsonMiddleware = (req, res, next) => {
  if (req.path !== "/api/message" && req.path !== "/api/agent/callback") {
    express.json()(req, res, next);
  } else {
    next();
  }
};
app.use(express.json());
app.use(jsonMiddleware);

// Populate req.user using Okta token if present
app.use(extractUserFromToken);

// NOTE: OLD sequelize.sync() block REMOVED from here.
// We will sync inside startServer after secure DB init.

app.use(httpLogger);

// --- ROUTES ---
app.use("/api/user", userRouter);
app.use("/api/agent", agentRouter);
app.use("/api/media", mediaRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/data", dataRoute);
app.use("/api/threads", threadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/conversation", conversationRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/artifacts", artifactsRoute);
app.use("/api/files", fileRoute);
app.use("/api", crudRouter);

// Global Error Handler
app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("API is running... (AWS/Okta Build)");
});

/**
 * Graceful Shutdown (AWS EC2/Lambda/ECS)
 */

function setupShutdownHandlers(server) {
  const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received - starting graceful shutdown`);
    try {
      await cleanupSocketIO();
      logger.info("Socket.IO connections closed");
    } catch (err) {
      logger.error("Error closing Socket.IO connections:", err);
    }

    const closeServer = new Promise((resolve) => {
      server.close(() => {
        logger.info("HTTP server closed");
        resolve();
      });
      setTimeout(() => {
        logger.warn("Force closing HTTP server after timeout");
        resolve();
      }, 10000);
    });

    await closeServer;

    try {
      await sequelize.close();
      logger.info("Database connections closed");
    } catch (dbError) {
      logger.error("Error closing database:", dbError);
    }

    process.exit(0);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

async function startServer() {
  try {
    // NEW: Initialize Postgres via AWS Secrets Manager (banking-grade secure)
    // await initPostgres();

    // After secrets-based DB init, sync Sequelize models
    await sequelize.sync();
    logger.info("Database synced");

    // Socket.IO (auth handled inside socketService with Okta if needed)
    const socketServices = await initializeSocketIO(server);
    app.set("socket", socketServices);

    const serverInstance = server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      logger.info(`Server started on port ${PORT}`);
    });

    setupShutdownHandlers(serverInstance);

    return serverInstance;
  } catch (err) {
    console.error("Failed to start server:", err);
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
}

const serverInstance = startServer();

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

module.exports = { app, server: serverInstance };


// src/app.js
// AWS Code Not Here
// require("dotenv").config({ path: `${__dirname}/../.env` });
// const express = require("express");
// const { createServer } = require("http");
// const cors = require("cors");

// // Routes
// const userRouter = require("./routes/userRoute");
// const crudRouter = require("./routes/crudRoute");
// const agentRouter = require("./routes/agentRoute");
// const mediaRouter = require("./routes/mediaRoute");
// const threadRoutes = require("./routes/threadRoute");
// const dashboardRouter = require("./routes/dashboardRoute");
// const artifactsRoute = require("./routes/artifactsRoute");
// const adminRoutes = require("./routes/adminRoute");
// const conversationRoutes = require("./routes/feedbackRoutes");
// const recommendationRoutes = require("./routes/recommendationRoutes.js");
// const dataRoute = require("./routes/dataRoute");
// const fileRoute = require("./routes/fileRoute");

// // ✅ DB: use initSequelize + getSequelize from ./config/database
// const { initSequelize, getSequelize } = require("./config/database");

// // Config & Utils
// const PORT = process.env.PORT || 3000;
// const { logger, httpLogger } = require("./utils/logger");
// const { initializeSocketIO, cleanupSocketIO } = require("./services/socketService");
// const helmetConfig = require("./config/helmetConfig");
// const errorHandler = require("./utils/errorHandler");

// // Okta Middleware
// const { extractUserFromToken } = require("./middlewares/authMiddleware");

// const app = express();
// const server = createServer(app);

// console.log("Environment:", process.env.NODE_ENV);

// // --- CORS Configuration (AWS-friendly) ---
// app.use(
//   cors({
//     origin: (origin, callback) => {
//       try {
//         if (!origin) return callback(null, true); // allow tools / curl / Postman

//         let allowedOriginsFromEnv = [];
//         try {
//           allowedOriginsFromEnv = JSON.parse(
//             process.env.ALLOWED_ORIGINS || "[]"
//           );
//         } catch (error) {
//           allowedOriginsFromEnv = [];
//         }

//         const productionOrigins = [
//           "http://localhost:3000",
//           "http://localhost:5000",
//           "http://localhost:5173",
//           ...allowedOriginsFromEnv,
//         ];

//         const uniqueOrigins = [...new Set(productionOrigins)];

//         // Exact match
//         if (uniqueOrigins.includes(origin) || uniqueOrigins.includes("*")) {
//           return callback(null, true);
//         }

//         // Pattern-based allow list
//         const allowedPatterns = [
//           /^https:\/\/.*\.amazonaws\.com$/, // AWS S3/CloudFront
//           /^https:\/\/.*\.elasticbeanstalk\.com$/, // Elastic Beanstalk
//           /^http:\/\/localhost:\d+$/, // Any localhost port
//           /^https:\/\/.*\.tigeranalytics\.com$/, // Org domain
//         ];

//         if (allowedPatterns.some((pattern) => pattern.test(origin))) {
//           return callback(null, true);
//         }

//         console.warn(`Express CORS blocked origin: ${origin}`);
//         callback(null, false);
//       } catch (error) {
//         console.error("CORS error:", error);
//         callback(null, false);
//       }
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
//     allowedHeaders: [
//       "Content-Type",
//       "Authorization",
//       "X-Requested-With",
//       "Accept",
//       "Origin",
//     ],
//   })
// );

// // Security headers
// app.use(helmetConfig);

// // JSON Middleware
// // Note: we only apply JSON parsing for most routes,
// // but skip for specific streaming/callback routes if needed.
// const jsonMiddleware = (req, res, next) => {
//   if (req.path !== "/api/message" && req.path !== "/api/agent/callback") {
//     return express.json()(req, res, next);
//   }
//   return next();
// };
// app.use(jsonMiddleware);

// // Populate req.user from Okta token if present
// app.use(extractUserFromToken);

// // HTTP logger (morgan/winston wrapper)
// app.use(httpLogger);

// // --- ROUTES ---
// app.use("/api/user", userRouter);
// app.use("/api/agent", agentRouter);
// app.use("/api/media", mediaRouter);
// app.use("/api/dashboard", dashboardRouter);
// app.use("/api/data", dataRoute);
// app.use("/api/threads", threadRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/conversation", conversationRoutes);
// app.use("/api/recommendations", recommendationRoutes);
// app.use("/api/artifacts", artifactsRoute);
// app.use("/api/files", fileRoute);
// app.use("/api", crudRouter);

// // Root health/info
// app.get("/", (req, res) => {
//   res.send("API is running... (AWS/Okta Build)");
// });

// // Global Error Handler
// app.use(errorHandler);

// /**
//  * Graceful Shutdown (AWS EC2/ECS/etc.)
//  */
// function setupShutdownHandlers(serverInstance) {
//   const gracefulShutdown = async (signal) => {
//     logger.info(`${signal} received - starting graceful shutdown`);

//     try {
//       await cleanupSocketIO();
//       logger.info("Socket.IO connections closed");
//     } catch (err) {
//       logger.error("Error closing Socket.IO connections:", err);
//     }

//     const closeServer = new Promise((resolve) => {
//       serverInstance.close(() => {
//         logger.info("HTTP server closed");
//         resolve();
//       });
//       setTimeout(() => {
//         logger.warn("Force closing HTTP server after timeout");
//         resolve();
//       }, 10000);
//     });

//     await closeServer;

//     try {
//       const sequelize = getSequelize();
//       await sequelize.close();
//       logger.info("Database connections closed");
//     } catch (dbError) {
//       logger.error("Error closing database:", dbError);
//     }

//     process.exit(0);
//   };

//   process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
//   process.on("SIGINT", () => gracefulShutdown("SIGINT"));
// }

// /**
//  * Bootstraps DB (Sequelize via AWS Secrets in prod / config.js in dev),
//  * initializes Socket.IO, and starts HTTP server.
//  */
// async function startServer() {
//   try {
//     // Initialize Sequelize
//     await initSequelize();
//     const sequelize = getSequelize();

//     // Sync models
//     await sequelize.sync();
//     logger.info("Database synced");

//     // Socket.IO setup
//     const socketServices = await initializeSocketIO(server);
//     app.set("socket", socketServices);

//     const serverInstance = server.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
//       logger.info(`Server started on port ${PORT}`);
//     });

//     setupShutdownHandlers(serverInstance);
//   } catch (err) {
//     console.error("Failed to start server:", err);
//     logger.error("Failed to start server:", err);
//     process.exit(1);
//   }
// }

// // Kick off everything
// startServer();

// // Process-level error handlers
// process.on("unhandledRejection", (reason, promise) => {
//   logger.error("Unhandled Promise Rejection:", reason);
// });

// process.on("uncaughtException", (error) => {
//   logger.error("Uncaught Exception:", error);
//   process.exit(1);
// });

// module.exports = { app };
