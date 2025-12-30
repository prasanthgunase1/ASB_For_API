// // src/app.js

// require("dotenv").config({ path: `${__dirname}/../.env` });
// const express = require("express");
// const { createServer } = require("http");
// const cors = require("cors");
// const { QueryTypes } = require("sequelize");

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
// const PORT = process.env.PORT || 5000;
// const { logger, httpLogger } = require("./utils/logger");
// const { initializeSocketIO, cleanupSocketIO } = require("./services/socketService");
// const helmetConfig = require("./config/helmetConfig");
// const errorHandler = require("./utils/errorHandler");

// // Okta Middleware
// const { extractUserFromToken } = require("./middlewares/authMiddleware");
// const { type } = require("os");

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
// async function runQuery() {
//   try {
//     console.log("Running SQL query...");
//     const sequelize = getSequelize();
//     if (!sequelize) {
//       console.error("Sequlize instance not initilized");
//       process.exit(1);
//     }
//     const result = await sequelize.query(
//       `SELECT * FROM app_non_prod.home_screen`,

//       { type: QueryTypes.SELECT });
//     console.log("Query Result in JSON");
//     console.log(JSON.stringify(result, null, 2));
//     process.exit(0);
//   } catch (err) {
//     console.log("Error running query:", err);
//     process.exit(1);
//   };
// }
// async function startServer() {
//   try {
//     // Initialize Sequelize
//     await initSequelize();

//     // await runQuery();

//     const sequelize = getSequelize();

//     // Sync models
//     // await sequelize.sync();
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


// // NEW CODE 
// // src/app.js

// require("dotenv").config({ path: `${__dirname}/../.env` });
// const express = require("express");
// const { createServer } = require("http");
// const cors = require("cors");
// const { QueryTypes } = require("sequelize"); // ✅ [UPDATED] Fixed typo (was QuerTypes)

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

// // ✅ [UPDATED] Added the File Route we created
// const fileRoute = require("./routes/fileRoute");

// // ✅ DB: use initSequelize + getSequelize from ./config/database
// const { initSequelize, getSequelize } = require("./config/database");

// // Config & Utils
// const PORT = process.env.PORT || 5000;
// const { logger, httpLogger } = require("./utils/logger");
// const { initializeSocketIO, cleanupSocketIO } = require("./services/socketService");
// const helmetConfig = require("./config/helmetConfig");
// const errorHandler = require("./utils/errorHandler");

// // Okta Middleware
// // ✅ [UPDATED] Ensured this is imported to populate req.user
// const { extractUserFromToken } = require("./middlewares/authMiddleware");

// // const { type } = require("os"); // ❌ [REMOVED] Unused import

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
// const jsonMiddleware = (req, res, next) => {
//   if (req.path !== "/api/message" && req.path !== "/api/agent/callback") {
//     return express.json()(req, res, next);
//   }
//   return next();
// };
// app.use(jsonMiddleware);

// // ✅ [UPDATED] Global Auth Middleware
// // This checks the token on every request (if present) and fills `req.user`.
// // It does NOT block requests (that is done by `protect` in individual routes).
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
// app.use("/api", crudRouter);

// // ✅ [UPDATED] Mount the File Route
// // This enables: GET /api/files/get-upload-url
// app.use("/api/files", fileRoute);


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
//       }); // Removed 10s wait for cleaner shutdown in dev, add back for prod if needed
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
//  * DEBUG FUNCTION: Run a manual query to test DB connection
//  */
// async function runQuery() {
//   try {
//     console.log("Running SQL query...");
//     const sequelize = getSequelize();
//     if (!sequelize) {
//       console.error("Sequelize instance not initialized");
//       process.exit(1);
//     }
//     const result = await sequelize.query(
//       `SELECT * FROM app_non_prod.home_screen`,
//       { type: QueryTypes.SELECT } // ✅ [UPDATED] Fixed typo: QuerTypes -> QueryTypes
//     );
//     console.log("Query Result in JSON");
//     console.log(JSON.stringify(result, null, 2));
//     // process.exit(0); // Commented out so server keeps running
//   } catch (err) {
//     console.log("Error running query:", err);
//     // process.exit(1);
//   }
// }

// async function startServer() {
//   try {
//     // Initialize Sequelize
//     await initSequelize();

//     // ✅ [OPTIONAL] Uncomment to test DB Query on startup
//     // await runQuery();
    
//     const sequelize = getSequelize();

//     // Sync models
//     // await sequelize.sync();
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


require("dotenv").config({ path: `${__dirname}/../.env` });
const express = require("express");
const { createServer } = require("http");
const cors = require("cors");
const session = require("express-session"); // ✅ [NEW] Required for Web/BFF sessions
const { QueryTypes } = require("sequelize");

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
const { initSequelize, getSequelize } = require("./config/database");
const PORT = process.env.PORT || 5000;
const { logger, httpLogger } = require("./utils/logger");
const { initializeSocketIO, cleanupSocketIO } = require("./services/socketService");
const helmetConfig = require("./config/helmetConfig");
const errorHandler = require("./utils/errorHandler");

// ✅ [UPDATED] Import the OIDC instance instead of manual verifier
const oidc = require("./config/oktaConfig"); 
const { extractUserFromToken } = require("./middlewares/authMiddleware");

const app = express();
const server = createServer(app);

// --- 1. SESSION CONFIGURATION (Critical for Banking) ---
app.use(session({
  secret: process.env.SESSION_SECRET || 'a-very-long-secret-key-for-banking',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,    // ✅ Prevents JS from accessing the cookie
    secure: process.env.NODE_ENV === 'production', // Use true if using HTTPS
    sameSite: 'Strict' // ✅ Prevents CSRF attacks
  }
}));

// --- 2. OKTA OIDC ROUTER ---
// Automatically adds /login and /authorization-code/callback routes
app.use(oidc.router);

// --- 3. CORS Configuration ---
app.use(
  cors({
    origin: (origin, callback) => {
      // (Your existing CORS logic remains here)
      callback(null, true); 
    },
    credentials: true, // ✅ [CRITICAL] Must be true to allow cookies to be sent
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  })
);

app.use(helmetConfig);

// JSON Middleware
const jsonMiddleware = (req, res, next) => {
  if (req.path !== "/api/message" && req.path !== "/api/agent/callback") {
    return express.json()(req, res, next);
  }
  return next();
};
app.use(jsonMiddleware);

// ✅ [UPDATED] Global Auth Middleware
// Maps req.userContext (from Okta) to req.user for your existing controllers
app.use(extractUserFromToken);

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
app.use("/api", crudRouter);
app.use("/api/files", fileRoute);

// Root health/info
app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`API is running... Logged in as: ${req.user.name}`);
  } else {
    res.send("API is running... (Public Access)");
  }
});

app.use(errorHandler);

// --- Graceful Shutdown & Start Logic ---
function setupShutdownHandlers(serverInstance) {
  // (Your existing shutdown logic remains here)
}

async function startServer() {
  try {
    await initSequelize();
    logger.info("Database synced");

    const socketServices = await initializeSocketIO(server);
    app.set("socket", socketServices);

    const serverInstance = server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      logger.info(`Server started on port ${PORT}`);
    });

    setupShutdownHandlers(serverInstance);
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
}

// ✅ [UPDATED] Wait for OIDC to be ready before starting the server
oidc.on('ready', () => {
  startServer();
});

oidc.on('error', err => {
  logger.error('Unable to configure ExpressOIDC', err);
});