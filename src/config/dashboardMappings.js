// PowerBI dashboard configurations
const powerBIMappings = {
  // Industry 1 - CPG Industry
  // Default mapping uses Retail Analysis Sample report
  1: {
    default: {
      reportId: "836c8d29-8318-40ac-8598-1d9981f837ee",
    },
    // Marketing Director persona (personaId 4) gets a different report
    // 4: {
    //   reportId: "f0ffd399-cafd-47a9-a404-8b75c92d93eb",
    // },
    // // Sales Director persona (personaId 2) - use the same report as default
    // 2: {
    //   reportId: "836c8d29-8318-40ac-8598-1d9981f837ee",
    // },
  },

  // Industry 2 - Pharma Industry
  2: {
    default: {
      reportId: "ef449a3f-fdac-47cf-bb9b-8dc8a2fc6da6",
      datasetId: "c80d8835-8965-4a64-80f4-863ea322e894",
    },
  },

  // Industry 3 - HIG Industry
  3: {
    default: {
      reportId: "16256e5c-6c46-4b1e-812d-9fbf97a410dc",
    },
  },
};

// MicroStrategy dashboard configurations
const microStrategyMappings = {
  // Industry 1 - default mapping for all personas
  1: {
    default: {
      projectId: "205BABE083484404399FBBA37BAA874A",
      dashboardId: "A1C9B94E8B47941DD2FA0DB58547A47B",
    },
  },

  // Industry 2 - default mapping for all personas
  2: {
    default: {
      projectId: "205BABE083484404399FBBA37BAA874A",
      dashboardId: "A1C9B94E8B47941DD2FA0DB58547A47B",
    },
  },
};

/**
 * Get PowerBI configuration for a specific industry and persona
 * @param {number|string} industryId - Industry ID
 * @param {number|string} personaId - Persona ID (optional)
 * @returns {Object} PowerBI configuration
 */
function getPowerBIConfig(industryId, personaId) {
  if (!industryId) return null;

  const industryMappings = powerBIMappings[industryId];
  if (!industryMappings) return null;

  // Try persona-specific mapping first
  if (personaId && industryMappings[personaId]) {
    return industryMappings[personaId];
  }

  // Fall back to default mapping for this industry
  return industryMappings.default;
}

/**
 * Get MicroStrategy configuration for a specific industry and persona
 * @param {number|string} industryId - Industry ID
 * @param {number|string} personaId - Persona ID (optional)
 * @returns {Object} MicroStrategy configuration
 */
function getMicroStrategyConfig(industryId, personaId) {
  if (!industryId) return null;

  const industryMappings = microStrategyMappings[industryId];
  if (!industryMappings) return null;

  // Try persona-specific mapping first
  if (personaId && industryMappings[personaId]) {
    return industryMappings[personaId];
  }

  // Fall back to default mapping for this industry
  return industryMappings.default;
}

module.exports = {
  powerBIMappings,
  microStrategyMappings,
  getPowerBIConfig,
  getMicroStrategyConfig,
};
