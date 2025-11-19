const artifactsService = require("../services/artifactsService");
const { logger } = require("../utils/logger");

class ArtifactsController {
  /**
   * Handle request to get all user artifacts
   * @route GET /api/artifacts
   */
  async getAllArtifacts(req, res, next) {
    try {
      const { userId, personaId } = req.query; // Or from req.user if using auth middleware

      if (!userId || !personaId) {
        return res.status(400).json({
          success: false,
          error: "userId and personaId are required query parameters.",
        });
      }

      const artifacts = await artifactsService.getArtifacts({ 
        userId: parseInt(userId), 
        personaId: parseInt(personaId) 
      });

      res.status(200).json({
        success: true,
        data: artifacts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle request to create (pin) a new artifact
   * @route POST /api/artifacts
   */
  async createArtifact(req, res, next) {
    try {
      // Assuming user_id and persona_id are also sent in the body
      const artifactData = req.body;

      if (!artifactData.user_id || !artifactData.persona_id || !artifactData.title || !artifactData.content) {
        return res.status(400).json({
            success: false,
            error: "Missing required fields: user_id, persona_id, title, content.",
        });
      }

      const newArtifact = await artifactsService.createArtifact(artifactData);

      res.status(201).json({
        success: true,
        message: "Artifact pinned successfully.",
        data: newArtifact,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle request to delete (unpin) an artifact
   * @route DELETE /api/artifacts/:id
   */
  async deleteArtifact(req, res, next) {
    try {
      const { id } = req.params;
      const { user_id } = req.body; // For security, get user_id from auth token in a real app (e.g., req.user.id)

      if (!user_id) {
          return res.status(400).json({ success: false, error: "user_id is required." });
      }

      await artifactsService.deleteArtifact({ 
        artifactId: parseInt(id), 
        userId: parseInt(user_id) 
      });

      res.status(204).send(); // Standard success response for DELETE
    } catch (error) {
      // Handle cases where the artifact wasn't found
      if (error.message.includes("Artifact not found")) {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  }
}

module.exports = new ArtifactsController();