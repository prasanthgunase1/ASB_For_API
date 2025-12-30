const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const dashboardController = require("../controllers/dashboardController");
const powerbiController = require("../controllers/powerbiController");
const microstrategyController = require("../controllers/microstrategyController");
const axios = require("axios");
const { logger } = require("../utils/logger");
const insightController = require("../controllers/dashboardController");

/**
 * OPTIMIZED Dashboard data management routes - protected with auth middleware
 * Core dashboard routes for immediate loading
 */
router.get("/homeDashboard", dashboardController.homeDashboard);
router.get("/homeSummary", dashboardController.homeSummary);
router.get(
  "/insightsDashboard",
  authMiddleware,
  dashboardController.insightsDashboard
);
router.get(
  "/insight-details",
  authMiddleware,
  dashboardController.getInsightDetails
);

/**
 * NEW: Optimized SQL query execution routes
 * These routes handle SQL execution separately from dashboard loading
 */
router.post(
  "/execute-insight-queries",
  authMiddleware,
  dashboardController.executeInsightQueries
);
router.post(
  "/execute-insight-query/:insightId",
  authMiddleware,
  dashboardController.executeInsightQuery
);

/**
 * Visual and insight management routes
 */
router.post("/resetVisual", authMiddleware, dashboardController.resetVisual);
router.post(
  "/get-next-unrefreshed-visual",
  authMiddleware,
  dashboardController.getNextUnrefreshedVisual
);
router.post("/update-visual", authMiddleware, dashboardController.updateVisual);

/**
 * Insight management routes
 */
router.get(
  "/get-next-unrefreshed-insight",
  authMiddleware,
  dashboardController.getNextUnrefreshedInsight
);
router.post(
  "/update-insight",
  authMiddleware,
  dashboardController.updateInsight
);
router.post(
  "/dashboards_to_ppt",
  authMiddleware,
  dashboardController.dashboardsToPpt
);

router.post(
  "/insights_to_ppt",
  authMiddleware,
  insightController.insightsToPpt
);


router.post(
  "/update-insight-anomaly",
  authMiddleware,
  dashboardController.updateInsightAnomaly
);
router.get(
  "/get-next-unrefreshed-anomaly",
  authMiddleware,
  dashboardController.getNextUnrefreshedAnomaly
);
router.get(
  "/get-all-visual-summaries",
  authMiddleware,
  dashboardController.getAllVisualSummaries
);
router.post(
  "/update-exec-summary",
  authMiddleware,
  dashboardController.updateExecSummary
);

/**
 * PowerBI SDK proxy endpoint - optimized for content security policy compatibility
 * This serves the PowerBI SDK script from a trusted source with proper headers
 */
router.get("/powerbi-sdk.js", async (req, res) => {
  const startTime = Date.now();
  logger.info("PowerBI SDK request received", {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    referer: req.headers.referer || "unknown",
  });

  try {
    // Set optimized headers for Azure CDN and CSP compatibility
    res.set({
      "Content-Type": "application/javascript",
      "Access-Control-Allow-Origin": "*", // Or specify your frontend URL for tighter security
      "Cache-Control": "public, max-age=86400, immutable", // Cache for 24h (86400s) for better performance
      "Vary": "Origin",
      "X-Content-Type-Options": "nosniff",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    });

    // Use the official Microsoft CDN with a specific version for stability
    const response = await axios.get(
      "https://cdn.jsdelivr.net/npm/powerbi-client@2.22.3/dist/powerbi.min.js",
      {
        responseType: "text",
        headers: {
          "Accept-Encoding": "gzip, deflate, br",
          "Cache-Control": "no-cache", // Don't cache the CDN response server-side
        },
        timeout: 10000, // 10 second timeout
      }
    );

    logger.info("PowerBI SDK fetched successfully", {
      size: response.data.length,
      time: `${Date.now() - startTime}ms`,
    });

    res.send(response.data);
  } catch (error) {
    logger.error("Error fetching PowerBI SDK:", {
      error: error.message,
      stack: error.stack,
      time: `${Date.now() - startTime}ms`,
    });

    // Return valid JavaScript with error recovery code for client-side fallback
    res.status(500).set({
      "Content-Type": "application/javascript",
      "Cache-Control": "no-cache, no-store, must-revalidate", // Don't cache errors
    }).send(`
        console.error('Error loading PowerBI SDK from server: ${error.message}');
        window.powerbiLoadFailed = true;
        
        // Attempt to load from CDN directly as fallback
        (function() {
          try {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/powerbi-client@2.22.3/dist/powerbi.min.js';
            script.async = true;
            script.onerror = function() { 
              console.error('Fallback PowerBI SDK load failed');
            };
            script.onload = function() {
              console.log('Fallback PowerBI SDK loaded successfully');
              window.powerbiLoadFailed = false;
            };
            document.body.appendChild(script);
          } catch (e) {
            console.error('Error in fallback loading:', e);
          }
        })();
      `);
  }
});

/**
 * PowerBI embedding and report management routes
 */
router.get(
  "/powerbi-config",
  authMiddleware,
  powerbiController.getPowerBIConfig
);
router.get(
  "/powerbi-embed-token",
  authMiddleware,
  powerbiController.getReportEmbedToken
);
router.get(
  "/powerbi-user-reports",
  authMiddleware,
  powerbiController.getUserReports
);
router.post(
  "/powerbi-track-usage",
  authMiddleware,
  powerbiController.trackPowerBIUsage
);
router.post(
  "/powerbi-execute-query",
  authMiddleware,
  powerbiController.executeDatasetQuery
);

/**
 * Additional PowerBI routes (available but not used in frontend yet)
 */
router.get(
  "/powerbi-dashboard-token",
  authMiddleware,
  powerbiController.getDashboardEmbedToken
);
router.get(
  "/powerbi-workspaces",
  authMiddleware,
  powerbiController.getUserWorkspaces
);
router.get(
  "/powerbi-dataset-refresh",
  authMiddleware,
  powerbiController.getDatasetRefreshHistory
);
router.get(
  "/powerbi-dataset-rls",
  authMiddleware,
  powerbiController.getDatasetRLS
);
router.get(
  "/powerbi-workspace-reports",
  authMiddleware,
  powerbiController.getWorkspaceReports
);

/**
 * MicroStrategy configuration routes
 */
router.get(
  "/microstrategy-config",
  authMiddleware,
  microstrategyController.getMicroStrategyConfig
);

/**
 * KPI management routes
 */
router.post("/kpis/:persona_id", authMiddleware, dashboardController.addKpis);
router.get(
  "/kpis/:persona_id",
  authMiddleware,
  dashboardController.getPersonaKpis
);

/**
 * Business insight and HLQ management routes
 */
router.post(
  "/insert_insight_hlq",
  authMiddleware,
  dashboardController.insertInsightHlq
);
router.post(
  "/insert_insight_persona",
  authMiddleware,
  dashboardController.insertInsightPersona
);
router.post(
  "/fetch_persona_hlq",
  authMiddleware,
  dashboardController.fetchPersonaHlq
);
router.post(
  "/update_insight_status",
  authMiddleware,
  dashboardController.updateInsightStatus
);
router.post(
  "/update_business_insight",
  authMiddleware,
  dashboardController.updateBusinessInsight
);

module.exports = router;
