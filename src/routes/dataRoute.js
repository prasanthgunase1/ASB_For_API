const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const dataController = require("../controllers/dataController");

router.post("/update-kpis", authMiddleware, dataController.updateKpis);
router.get("/get-kpi", authMiddleware, dataController.getPersona);
router.get("/get-task", authMiddleware, dataController.getTask);
router.post("/update-task", authMiddleware, dataController.updateTask);
router.post("/create-task", authMiddleware, dataController.createTask);
router.get(
  "/get-pusr-data-table",
  authMiddleware,
  dataController.getPusrDataTable
);
router.get(
  "/get-usr-data-table",
  authMiddleware,
  dataController.getUsrDataTable
);
router.post("/save-workflow", authMiddleware, dataController.saveWorkflow);
router.get(
  "/get-workflow-steps",
  authMiddleware,
  dataController.getWorkflowSteps
);

module.exports = router;
