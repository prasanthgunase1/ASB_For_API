const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const adminController = require("../controllers/adminController");

// Personas management
router.get("/personas", authMiddleware, adminController.getPersonas);
router.post("/personas", authMiddleware, adminController.updatePersona);

// BI dashboards management
router.get("/bi-dashboards", authMiddleware, adminController.getBiDashboards);
router.post(
  "/bi-dashboards",
  authMiddleware,
  adminController.updateBiDashboard
);

// Database tables (mock data for now)
router.get("/db-tables", authMiddleware, adminController.getDbTables);

// Users management - updated with  AD integration
router.get("/users", authMiddleware, adminController.getUsers);
router.get("/users/:userId", authMiddleware, adminController.getUserById);
router.post("/users", authMiddleware, adminController.updateUser);
router.post(
  "/users/:userId/reset",
  authMiddleware,
  adminController.resetUserAccess
);

// System status and configuration
router.get("/system-status", authMiddleware, adminController.getSystemStatus);
router.get(
  "/recent-activities",
  authMiddleware,
  adminController.getRecentActivities
);
router.get("/config", authMiddleware, adminController.getAppConfig);
router.post("/config", authMiddleware, adminController.updateAppConfig);

module.exports = router;