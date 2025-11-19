const { getMicroStrategyConfig } = require("../config/dashboardMappings");
const { logger } = require("../utils/logger");

/**
 * Get MicroStrategy configuration based on industry and persona
 */
exports.getMicroStrategyConfig = async (req, res, next) => {
  try {
    // Get industry and persona from request parameters or from user info
    const industryId = req.query.industryId || req.user?.selectedIndustryId;
    const personaId = req.query.personaId || req.user?.selectedPersonaId;

    logger.info(
      `Getting MicroStrategy config for industry ${industryId}, persona ${personaId}`
    );

    // Default configuration - fallback when no mapping exists
    let config = {
      baseUrl:
        process.env.VITE_MICROSTRATEGY_BASE_URL ||
        "https://autotrial.microstrategy.com/MicroStrategyLibrary",
      projectId:
        process.env.VITE_MICROSTRATEGY_PROJECT_ID ||
        "205BABE083484404399FBBA37BAA874A",
      dashboardId:
        process.env.VITE_MICROSTRATEGY_DASHBOARD_ID ||
        "A1C9B94E8B47941DD2FA0DB58547A47B",
    };

    // Get industry-persona specific configuration
    const specificConfig = getMicroStrategyConfig(industryId, personaId);

    if (specificConfig) {
      // Override with specific configuration
      config = {
        ...config,
        ...specificConfig,
      };

      logger.info(
        "Using custom MicroStrategy configuration for industry/persona"
      );
    } else {
      logger.info("No custom MicroStrategy configuration found, using default");
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    logger.error("Error in getMicroStrategyConfig:", error);
    next(error);
  }
};
