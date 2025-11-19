const { UserArtifacts } = require("../db/models");
const { logger } = require("../utils/logger");

/**
 * Get all artifacts for a specific user and persona
 * @param {Object} params - Parameters
 * @param {number} params.userId - The ID of the user
 * @param {number} params.personaId - The ID of the persona
 * @returns {Promise<Array<Object>>} Array of artifact objects
 */
exports.getArtifacts = async ({ userId, personaId }) => {
  try {
    logger.info(`Fetching artifacts for user_id: ${userId} and persona_id: ${personaId}`);
    
    const artifacts = await UserArtifacts.findAll({
      where: {
        user_id: userId,
        persona_id: personaId,
      },
      order: [['created_at', 'DESC']],
    });
    
    return artifacts;
  } catch (error) {
    logger.error(`Error fetching artifacts:`, error);
    throw error;
  }
};

/**
 * Create a new artifact (pin a chart)
 * @param {Object} artifactData - The data for the new artifact
 * @returns {Promise<Object>} The created artifact object
 */
exports.createArtifact = async (artifactData) => {
  try {
    logger.info(`Creating new artifact with title: ${artifactData.title}`);
    
    const newArtifact = await UserArtifacts.create(artifactData);
    
    return newArtifact;
  } catch (error) {
    logger.error(`Error creating artifact:`, error);
    throw error;
  }
};

/**
 * Delete an artifact by its ID
 * @param {Object} params - Parameters
 * @param {number} params.artifactId - The ID of the artifact to delete
 * @param {number} params.userId - The ID of the user requesting the deletion (for security)
 * @returns {Promise<boolean>} True if deletion was successful
 */
exports.deleteArtifact = async ({ artifactId, userId }) => {
  try {
    logger.info(`Deleting artifact id: ${artifactId} for user_id: ${userId}`);
    
    const result = await UserArtifacts.destroy({
      where: {
        id: artifactId,
        user_id: userId, // Ensure users can only delete their own artifacts
      },
    });
    
    if (result === 0) {
      throw new Error("Artifact not found or user not authorized to delete.");
    }

    return true;
  } catch (error) {
    logger.error(`Error deleting artifact:`, error);
    throw error;
  }
};
