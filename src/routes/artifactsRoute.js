const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const artifactsController = require("../controllers/artifactsController");

// --- Artifacts Routes ---

// GET all artifacts for a user/persona
router.get("/", authMiddleware, artifactsController.getAllArtifacts);

// POST a new artifact (pin a chart)
router.post("/", authMiddleware, artifactsController.createArtifact);

// DELETE an artifact by its ID (unpin)
router.delete("/:id", authMiddleware, artifactsController.deleteArtifact);

module.exports = router;
