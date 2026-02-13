// src/app.js
require("dotenv").config({ path: `${__dirname}/../.env` });

const express = require("express");
const { createServer } = require("http");
const cors = require("cors");
const session = require("express-session");

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

// ✅ Snowflake SDK (single cached connection)
const { connectSnowflake, runQuery, closeSnowflake } = require("./db/database");

// Config & Utils
const PORT = process.env.PORT || 5000;
const { logger, httpLogger } = require("./utils/logger");
const { initializeSocketIO, cleanupSocketIO } = require("./services/socketService");
const helmetConfig = require("./config/helmetConfig");
const errorHandler = require("./utils/errorHandler");

// ✅ Okta OIDC
const oidc = require("./config/oktaConfig");

// ✅ Your Auth middleware (OPTIONAL mapper)
const { extractUserFromToken } = require("./middlewares/authMiddleware");

const app = express();
const server = createServer(app);
const SESSION_SECRET = process.env.SESSION_SECRET || "a-very-long-secret-key-for-banking";

let serverInstance = null;
let isShuttingDown = false;

// -------------------- 0) Basic request log (helps debugging) --------------------
app.use((req, _res, next) => {
  console.log("REQ:", req.method, req.url);
  next();
});

// -------------------- 1) CORS (AWS-friendly, supports allow list + regex patterns) --------------------
app.use(
  cors({
    origin: (origin, callback) => {
      try {
        if (!origin) return callback(null, true); // allow tools / curl / Postman

        let allowedOriginsFromEnv = [];
        try {
          allowedOriginsFromEnv = JSON.parse(process.env.ALLOWED_ORIGINS || "[]");
        } catch (_e) {
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

        // Pattern-based allow list
        const allowedPatterns = [
          /^https:\/\/.*\.amazonaws\.com$/,
          /^https:\/\/.*\.elasticbeanstalk\.com$/,
          /^https?:\/\/localhost:\d+$/,
          /^https:\/\/.*\.tigeranalytics\.com$/,
        ];

        if (allowedPatterns.some((pattern) => pattern.test(origin))) {
          return callback(null, true);
        }

        console.warn(`Express CORS blocked origin: ${origin}`);
        return callback(null, false);
      } catch (err) {
        console.error("CORS error:", err);
        return callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  })
);

// -------------------- 2) SESSION --------------------
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // set true behind https + proper proxy config
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// -------------------- 3) OKTA OIDC ROUTER --------------------
app.use(oidc.router);

// -------------------- 4) AUTH ROUTES --------------------
app.get("/auth/login", (req, res) => {
  const authenticated = req.isAuthenticated && req.isAuthenticated();

  if (authenticated) {
    const userInfo = req.userContext?.userinfo || {};
    return res.status(200).json({
      sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name || "",
      groups: userInfo.groups || [],
    });
  }

  return res.status(401).json({ message: "Not Authenticated" });
});

app.post("/auth/logout", (req, res) => {
  req.session?.destroy((destroyErr) => {
    if (destroyErr) return res.status(500).json({ message: "Failed to logout" });
    res.clearCookie("connect.sid");
    return res.status(200).json({ success: true });
  });
});

app.get("/auth/debug", (req, res) => {
  res.json({
    url: req.originalUrl,
    hasCookiesHeader: !!req.headers.cookie,
    cookieHeader: req.headers.cookie || null,
    sessionId: req.sessionID || null,
    hasSession: !!req.session,
    sessionKeys: req.session ? Object.keys(req.session) : [],
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    hasUserContext: !!req.userContext,
  });
});

// -------------------- 5) Populate req.user from token if present --------------------
app.use(extractUserFromToken);

// -------------------- 6) Security headers --------------------
app.use(helmetConfig);

// -------------------- 7) JSON Middleware (skip streaming/callback routes) --------------------
const jsonMiddleware = (req, res, next) => {
  if (req.path !== "/api/message" && req.path !== "/api/agent/callback") {
    return express.json()(req, res, next);
  }
  return next();
};
app.use(jsonMiddleware);

// -------------------- 8) HTTP logger --------------------
app.use(httpLogger);

// -------------------- 9) API ROUTES --------------------
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

// Optional Snowflake health check
app.get("/api/snowflake/ping", async (_req, res) => {
  try {
    const rows = await runQuery(`
      SELECT CURRENT_ROLE() AS ROLE,
             CURRENT_WAREHOUSE() AS WAREHOUSE,
             CURRENT_DATABASE() AS DATABASE,
             CURRENT_SCHEMA() AS SCHEMA
    `);
    res.json({ success: true, data: rows[0] || null });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Root
app.get("/", (req, res) => {
  const authenticated = req.isAuthenticated && req.isAuthenticated();
  if (authenticated) {
    const userInfo = req.userContext?.userinfo || {};
    return res.send(`API is running... Logged in as: ${userInfo.email || userInfo.sub}`);
  }
  return res.send("API is running... (Public Access)");
});

// Error handler
app.use(errorHandler);

// -------------------- 10) Graceful shutdown --------------------
function closeHttpServer(instance, timeoutMs = 10000) {
  if (!instance) return Promise.resolve("HTTP server not started");

  return new Promise((resolve) => {
    let done = false;
    const finish = (msg) => {
      if (done) return;
      done = true;
      resolve(msg);
    };

    instance.close(() => finish("HTTP server closed"));
    setTimeout(() => finish("Force closing HTTP server after timeout"), timeoutMs);
  });
}

async function shutdown(signal, exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  try {
    logger.info(`⚠️ Shutdown signal received: ${signal}`);

    // 1) Close Socket.IO
    try {
      await cleanupSocketIO();
      logger.info("✅ Socket.IO connections closed");
    } catch (socketErr) {
      logger.error("❌ Error closing Socket.IO:", socketErr);
    }

    // 2) Close HTTP server
    const httpMsg = await closeHttpServer(serverInstance, 10000);
    logger.info(`✅ ${httpMsg}`);

    // 3) Close Snowflake
    await closeSnowflake();
    logger.info("✅ Snowflake connection closed");
  } catch (e) {
    logger.error("❌ Shutdown error:", e);
  } finally {
    process.exit(exitCode);
  }
}

process.on("SIGINT", () => shutdown("SIGINT", 0));
process.on("SIGTERM", () => shutdown("SIGTERM", 0));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Promise Rejection:", reason);
  shutdown("unhandledRejection", 1);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  shutdown("uncaughtException", 1);
});

// -------------------- 11) Start server (wait for OIDC ready) --------------------
async function startServer() {
  try {
    await connectSnowflake();
    logger.info("✅ Database (Snowflake) connected & ready");

    const ctx = await runQuery(
      "SELECT CURRENT_DATABASE() AS DB, CURRENT_SCHEMA() AS SCHEMA"
    );
    logger.info(`Snowflake context: ${JSON.stringify(ctx[0] || {})}`);

    // Socket.IO setup
    const socketServices = await initializeSocketIO(server);
    app.set("socket", socketServices);

    serverInstance = server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`🚀 Server started on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

oidc.on("ready", () => {
  console.log("✅ Okta OIDC ready");
  startServer();
});

oidc.on("error", (err) => {
  logger.error("Unable to configure ExpressOIDC", err);
});

module.exports = { app };



// BOTH CODE FOR OKTA CODE SPA AND MPA
// require("dotenv").config({ path: `${__dirname}/../.env` });

// const express = require("express");
// const { createServer } = require("http");
// const cors = require("cors");
// const session = require("express-session");

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

// // ✅ THIS ROUTE CONTAINS BOTH SPA & MPA ENDPOINTS
// const fileRoute = require("./routes/fileRoute"); // 🟢 MPA & 🔵 SPA Shared

// // ✅ Snowflake SDK
// const { connectSnowflake, runQuery, closeSnowflake } = require("./db/database");

// // Config & Utils
// const PORT = process.env.PORT || 5000;
// const { logger, httpLogger } = require("./utils/logger");
// const { initializeSocketIO, cleanupSocketIO } = require("./services/socketService");
// const helmetConfig = require("./config/helmetConfig");
// const errorHandler = require("./utils/errorHandler");

// // --------------------------------------------------------------------------
// // ✅ AUTH CONFIG IMPORT
// // We destructure 'oidc' because oktaConfig exports { oidc, spaVerifier }
// // --------------------------------------------------------------------------
// const { oidc } = require("./config/oktaConfig"); // 🟢 MPA Logic (Redirects)

// // ✅ HYBRID AUTH MIDDLEWARE
// // This middleware checks for EITHER a Token (SPA) OR a Cookie (MPA)
// const { extractUserFromToken } = require("./middlewares/authMiddleware"); // 🟢 & 🔵 Hybrid

// const app = express();
// const server = createServer(app);
// const SESSION_SECRET = process.env.SESSION_SECRET || "a-very-long-secret-key-for-banking";

// let serverInstance = null;
// let isShuttingDown = false;

// // -------------------- 0) Basic request log --------------------
// app.use((req, _res, next) => {
//   console.log("REQ:", req.method, req.url);
//   next();
// });

// // -------------------- 1) CORS --------------------
// app.use(
//   cors({
//     origin: (origin, callback) => {
//       // ... (Existing CORS logic) ...
//       if (!origin) return callback(null, true);
//       const allowedOrigins = ["http://localhost:3000", "http://localhost:5000"];
//       if (allowedOrigins.includes(origin) || origin.includes("localhost")) {
//         return callback(null, true);
//       }
//       return callback(null, true); // Simplified for dev
//     },
//     credentials: true, // 🟢 MPA: Required for Cookies
//     allowedHeaders: ["Content-Type", "Authorization"], // 🔵 SPA: Required for Bearer Token
//   })
// );

// // -------------------- 2) SESSION --------------------
// // 🟢 MPA SPECIFIC: Only web pages need server-side sessions
// app.use(
//   session({
//     secret: SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       httpOnly: true,
//       secure: false, // Set true in production
//       maxAge: 24 * 60 * 60 * 1000,
//     },
//   })
// );

// // -------------------- 3) OKTA OIDC ROUTER --------------------
// // 🟢 MPA SPECIFIC: Handles /auth/login redirects for browsers
// app.use(oidc.router);

// // -------------------- 4) GLOBAL USER POPULATOR --------------------
// // 🟢 & 🔵 HYBRID: Reads req.headers.authorization OR req.session
// app.use(extractUserFromToken);

// // -------------------- 5) AUTH STATUS ROUTES --------------------
// app.get("/auth/login", (req, res) => {
//   // 🟢 MPA CHECK: .isAuthenticated() comes from OIDC middleware
//   if (req.isAuthenticated && req.isAuthenticated()) {
//     return res.status(200).json(req.userContext?.userinfo || {});
//   }
//   return res.status(401).json({ message: "Not Authenticated" });
// });

// app.post("/auth/logout", (req, res) => {
//   // 🟢 MPA LOGIC: Destroy session
//   req.session?.destroy(() => {
//     res.clearCookie("connect.sid");
//     res.json({ success: true });
//   });
// });

// // -------------------- 6) MIDDLEWARE & LOGGING --------------------
// app.use(helmetConfig);
// app.use(httpLogger);
// app.use((req, res, next) => {
//   // Skip JSON parse for streaming callbacks
//   if (req.path !== "/api/agent/callback") return express.json()(req, res, next);
//   next();
// });

// // -------------------- 7) API ROUTES --------------------
// app.use("/api/user", userRouter);
// app.use("/api/dashboard", dashboardRouter);

// // ✅ FILES ROUTE: This router file contains:
// // - router.get('/spa/upload-url', protectSPA ...)  <-- 🔵 SPA
// // - router.get('/web/upload-url', protectMPA ...)  <-- 🟢 MPA
// app.use("/api/files", fileRoute);

// app.use("/api", crudRouter);
// // ... (Other routes)

// // -------------------- 8) START SERVER --------------------
// async function startServer() {
//   try {
//     await connectSnowflake();
//     const socketServices = await initializeSocketIO(server);
//     app.set("socket", socketServices);
//     serverInstance = server.listen(PORT, () => {
//       console.log(`🚀 Server running on http://localhost:${PORT}`);
//     });
//   } catch (error) {
//     process.exit(1);
//   }
// }

// // 🟢 MPA: Wait for OIDC to be ready before starting
// oidc.on("ready", () => {
//   console.log("✅ Okta OIDC ready");
//   startServer();
// });

// oidc.on("error", (err) => console.error("OIDC Error", err));

// module.exports = { app };


// // AUTH O TESTING CODE
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Fixes the self-signed cert error

// const express = require('express');
// const { auth } = require('express-openid-connect');
// const cors = require('cors'); // <--- 1. Import CORS
// const app = express();

// // <--- 2. Enable CORS so React (port 3000) can talk to Backend (port 5000)
// app.use(cors({
//   origin: 'http://localhost:3000', // Allow React frontend
//   credentials: true                // Allow cookies to be sent back and forth
// }));

// const config = {
//   authRequired: false,
//   auth0Logout: true,
//   secret: 'a_very_long_random_string_for_encryption_keep_it_safe', 
//   baseURL: 'http://localhost:5000',
//   clientID: 'Hq1Xjc1A1gIvNk7XEZp2deoP3p9hpNKO',
//   clientSecret: '5VGST9idiWfVCn4QXoXE8Suoiw1Xvod27WrFx8WGGyrTQNLYjqarFQmKtdddQrOS',
//   issuerBaseURL: 'https://dev-yaoqhxirbtpcez40.us.auth0.com',
//   authorizationParams: {
//     response_type: 'code',
//     // response_mode: 'query' <--- DELETED: This line causes the crash. 
//     // The library defaults to 'form_post' automatically.
//   },
// };

// app.use(auth(config));

// // API Status Route (This is what React will fetch)
// app.get('/api/status', (req, res) => {
//   res.json({ 
//     isAuthenticated: req.oidc.isAuthenticated(), 
//     user: req.oidc.isAuthenticated() ? req.oidc.user : null 
//   });
// });

// // Redirect to React after login
// app.get('/', (req, res) => {
//     // If logged in, go to React dashboard
//     if(req.oidc.isAuthenticated()) {
//         res.redirect('http://localhost:3000');
//      res.send(req.oidc.isAuthenticated() ? `Logged in as ${req.oidc.user.name}` : 'Logged out');
//     } 
// });

// app.listen(5000, () => {
//   console.log('Backend listening on http://localhost:5000');
// });

// LOCAL SNOWFLAKE TESTING CODE

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Keep this at the top
// require('dotenv').config();
// const express = require('express');
// const snowflake = require('snowflake-sdk');

// const app = express();
// app.use(express.json());

// // -------------------- Snowflake Connection --------------------
// const connection = snowflake.createConnection({
//   account: process.env.SNOWFLAKE_ACCOUNT,
//   username: process.env.SNOWFLAKE_USERNAME,
//   password: process.env.SNOWFLAKE_PASSWORD,
//   warehouse: process.env.SNOWFLAKE_WAREHOUSE,
//   database: process.env.SNOWFLAKE_DATABASE,
//   schema: process.env.SNOWFLAKE_SCHEMA,
  
//   // 👇 THIS IS THE MISSING PART 👇
//   insecureConnect: true,  // Forces the SDK to ignore the SSL error
//   ocspMode: 'FAIL_OPEN'   // Prevents OCSP checks from blocking you
// });

// connection.connect((err, conn) => {
//   if (err) {
//     console.error('❌ Snowflake connection failed:', err.message);
//     // Do not exit process here, let the server start so we can debug
//   } else {
//     console.log('✅ Connected to Snowflake');
//   }
// });

// // -------------------- Routes --------------------

// app.get('/home-screen', (req, res) => {
//   const query = `SELECT * FROM SNOWFLAKE_AI_BI.APP_SCHEMA.HOME_SCREEN ORDER BY VISUAL_ID;`;

//   // Check if connection is actually active before querying
//   if (!connection.isUp()) {
//     return res.status(500).json({ error: "Connection is currently down" });
//   }

//   connection.execute({
//     sqlText: query,
//     complete: (err, stmt, rows) => {
//       if (err) {
//         console.error('❌ Query failed:', err.message);
//         return res.status(500).json({ error: err.message });
//       }
//       res.json(rows);
//     }
//   });
// });

// app.get('/home-screen/:clientId', (req, res) => {
//   const { clientId } = req.params;
//   const query = `SELECT * FROM SNOWFLAKE_AI_BI.APP_SCHEMA.HOME_SCREEN WHERE CLIENT_ID = ?;`;

//   connection.execute({
//     sqlText: query,
//     binds: [clientId],
//     complete: (err, stmt, rows) => {
//       if (err) {
//         console.error('❌ Query failed:', err.message);
//         return res.status(500).json({ error: err.message });
//       }
//       res.json(rows);
//     }
//   });
// });

// // -------------------- Start Server --------------------
// const PORT = 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });