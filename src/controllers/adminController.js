const {
  Persona,
  UserAccess,
  Client,
  Industry,
  Users,
  sequelize,
} = require("../db/models");
const { logger } = require("../utils/logger");
const { Op } = require("sequelize");
const {
  powerBIMappings,
  microStrategyMappings,
} = require("../config/dashboardMappings");
// Azure AD service removed – system now uses Okta + local DB only
// const azureAdService = require("../services/azureAdService");

/**
 * Get all personas for the authenticated user or filtered by industry
 * @route GET /api/admin/personas
 */
exports.getPersonas = async (req, res, next) => {
  try {
    const { industryId } = req.query;
    const username = req.user?.username;

    if (!username) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Base query options
    const queryOptions = {
      include: [],
      order: [["persona", "ASC"]],
    };

    // If industryId is provided, filter personas by industryId through UserAccess
    if (industryId) {
      queryOptions.include.push({
        model: UserAccess,
        as: "UserAccesses",
        required: true,
        where: { industry_id: industryId },
        attributes: [],
      });
    }

    // Fetch all personas
    const personas = await Persona.findAll(queryOptions);

    // Map to desired output format with safe JSON parsing
    const formattedPersonas = personas.map((persona) => {
      let parsedKPIs = [];
      let parsedHomeSummary = null;

      // Safely parse KPIs with improved validation
      if (persona.KPIs) {
        try {
          // Convert to string and trim whitespace
          const kpisStr = String(persona.KPIs).trim();

          // Check if it looks like JSON before parsing
          if (
            (kpisStr.startsWith("{") && kpisStr.endsWith("}")) ||
            (kpisStr.startsWith("[") && kpisStr.endsWith("]"))
          ) {
            parsedKPIs = JSON.parse(kpisStr);
          } else {
            // If it doesn't look like JSON, use as a plain value
            parsedKPIs = [{ name: "KPI", value: kpisStr }];
            logger.debug(
              `KPIs for persona ${persona.persona_id} is not in JSON format`
            );
          }
        } catch (error) {
          // Downgrade to debug level since we're handling this gracefully
          logger.debug(
            `Error parsing KPIs for persona ${persona.persona_id}:`,
            error
          );
          // Fallback: Treat the raw string as a single KPI value
          parsedKPIs = [{ name: "KPI", value: String(persona.KPIs) }];
        }
      }

      // Safely parse home_exec_summary with similar validation
      if (persona.home_exec_summary) {
        try {
          // Convert to string and trim whitespace
          const summaryStr = String(persona.home_exec_summary).trim();

          // Check if it looks like JSON before parsing
          if (
            (summaryStr.startsWith("{") && summaryStr.endsWith("}")) ||
            (summaryStr.startsWith("[") && summaryStr.endsWith("]"))
          ) {
            parsedHomeSummary = JSON.parse(summaryStr);
          } else {
            // If it doesn't look like JSON, use as plain content
            parsedHomeSummary = { content: summaryStr };
            logger.debug(
              `home_exec_summary for persona ${persona.persona_id} is not in JSON format`
            );
          }
        } catch (error) {
          // Downgrade to debug level
          logger.debug(
            `Error parsing home_exec_summary for persona ${persona.persona_id}:`,
            error
          );
          // Fallback: Use the raw string as summary content
          parsedHomeSummary = { content: String(persona.home_exec_summary) };
        }
      }

      return {
        id: persona.persona_id,
        name: persona.persona,
        context: persona.persona_context,
        KPIs: parsedKPIs,
        homeSummary: parsedHomeSummary,
        insightsSummary: persona.insights_exec_summary,
        createdAt: persona.created_at,
        updatedAt: persona.updated_at,
      };
    });

    return res.json({
      success: true,
      data: formattedPersonas,
    });
  } catch (error) {
    logger.error("Error fetching personas:", error);
    next(error);
  }
};

/**
 * Create or update a persona
 * @route POST /api/admin/personas
 */
exports.updatePersona = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      id,
      name,
      context,
      KPIs,
      homeSummary,
      insightsSummary,
      industryId,
    } = req.body;
    const username = req.user?.username;

    if (!username) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!name || name.trim() === "") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Persona name is required",
      });
    }

    if (!industryId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Industry ID is required",
      });
    }

    let persona;

    // Format data for database with safe JSON stringification
    const personaData = {
      persona: name,
      persona_context: context || null,
      KPIs: KPIs ? JSON.stringify(KPIs) : null,
      home_exec_summary: homeSummary ? JSON.stringify(homeSummary) : null,
      insights_exec_summary: insightsSummary || null,
    };

    if (id) {
      persona = await Persona.findByPk(id, { transaction });
      if (!persona) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Persona not found",
        });
      }

      // Update the persona
      await persona.update(personaData, { transaction });
    } else {
      // Create new persona
      persona = await Persona.create(personaData, { transaction });

      // Create persona-industry link in UserAccess
      await UserAccess.create(
        {
          persona_id: persona.persona_id,
          industry_id: industryId,
          client_id: 0, // Default value, adjust as needed
          user_id: 0, // Default value, adjust as needed
          data_source_id: 0, // Default value, adjust as needed
        },
        { transaction }
      );
    }

    await transaction.commit();

    // Safely parse the KPIs and homeSummary for the response
    let parsedKPIs = [];
    let parsedHomeSummary = null;

    try {
      parsedKPIs = persona.KPIs ? JSON.parse(persona.KPIs) : [];
    } catch (error) {
      logger.warn(`Failed to parse KPIs for response: ${error.message}`);
    }

    try {
      parsedHomeSummary = persona.home_exec_summary
        ? JSON.parse(persona.home_exec_summary)
        : null;
    } catch (error) {
      logger.warn(
        `Failed to parse home_exec_summary for response: ${error.message}`
      );
    }

    return res.json({
      success: true,
      message: id
        ? "Persona updated successfully"
        : "Persona created successfully",
      data: {
        id: persona.persona_id,
        name: persona.persona,
        context: persona.persona_context,
        KPIs: parsedKPIs,
        homeSummary: parsedHomeSummary,
        insightsSummary: persona.insights_exec_summary,
        createdAt: persona.created_at,
        updatedAt: persona.updated_at,
        industryId: parseInt(industryId),
      },
    });
  } catch (error) {
    await transaction.rollback();
    logger.error("Error updating persona:", error);
    next(error);
  }
};

/**
 * Get all BI dashboard configurations
 * @route GET /api/admin/bi-dashboards
 */
exports.getBiDashboards = async (req, res, next) => {
  try {
    const username = req.user?.username;
    const { industryId } = req.query;

    if (!username) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Combine PowerBI and MicroStrategy configurations
    const biDashboards = [];

    // Process PowerBI mappings
    Object.entries(powerBIMappings)
      .filter(([id]) => !industryId || id === industryId)
      .forEach(([industryIdKey, industryMappings]) => {
        Object.entries(industryMappings).forEach(
          ([personaKey, personaConfig]) => {
            biDashboards.push({
              id: `powerbi-${industryIdKey}-${personaKey}`,
              name: `PowerBI - Industry ${industryIdKey} - ${
                personaKey === "default"
                  ? "All Personas"
                  : `Persona ${personaKey}`
              }`,
              type: "powerbi",
              industryId: parseInt(industryIdKey),
              personaId:
                personaKey === "default" ? null : parseInt(personaKey),
              config: personaConfig,
            });
          }
        );
      });

    // Process MicroStrategy mappings
    Object.entries(microStrategyMappings)
      .filter(([id]) => !industryId || id === industryId)
      .forEach(([industryIdKey, industryMappings]) => {
        Object.entries(industryMappings).forEach(
          ([personaKey, personaConfig]) => {
            biDashboards.push({
              id: `microstrategy-${industryIdKey}-${personaKey}`,
              name: `MicroStrategy - Industry ${industryIdKey} - ${
                personaKey === "default"
                  ? "All Personas"
                  : `Persona ${personaKey}`
              }`,
              type: "microstrategy",
              industryId: parseInt(industryIdKey),
              personaId:
                personaKey === "default" ? null : parseInt(personaKey),
              config: personaConfig,
            });
          }
        );
      });

    // Sort by type, then industry, then persona
    biDashboards.sort((a, b) => {
      if (a.industryId !== b.industryId) return a.industryId - b.industryId;
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return (a.personaId || 0) - (b.personaId || 0);
    });

    return res.json({
      success: true,
      data: biDashboards,
    });
  } catch (error) {
    logger.error("Error fetching BI dashboards:", error);
    next(error);
  }
};

/**
 * Create or update a BI dashboard configuration
 * @route POST /api/admin/bi-dashboards
 */
exports.updateBiDashboard = async (req, res, next) => {
  try {
    const { id, type, industryId, personaId, config, name } = req.body;
    const username = req.user?.username;

    if (!username) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!type || !industryId || !config) {
      return res.status(400).json({
        success: false,
        message: "Type, industryId, and config are required",
      });
    }

    // NOTE: In a real implementation, this would modify the dashboardMappings.js file
    // or update a database table. For this example, we'll just return success.
    logger.info(
      `Dashboard update requested for ${type} in industry ${industryId}`
    );

    // For simplicity, we'll return the updated config as if it was saved
    return res.json({
      success: true,
      message: "Dashboard configuration updated successfully",
      data: {
        id: id || `${type}-${industryId}-${personaId || "default"}`,
        type,
        industryId: parseInt(industryId),
        personaId: personaId ? parseInt(personaId) : null,
        name:
          name ||
          `${type} - Industry ${industryId} - ${
            personaId ? `Persona ${personaId}` : "All Personas"
          }`,
        config,
      },
    });
  } catch (error) {
    logger.error("Error updating BI dashboard:", error);
    next(error);
  }
};

/**
 * Get database tables (mock data for now)
 * @route GET /api/admin/db-tables
 */
exports.getDbTables = async (req, res, next) => {
  try {
    const { industryId } = req.query;
    const username = req.user?.username;

    if (!username) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // This is mock data - in a real implementation, we would fetch from database
    // or call a service that provides this information
    const mockTables = [
      {
        id: "1",
        name: "SALES_FACT",
        schema: "DBO",
        industryId: 1,
        description: "Contains sales transactions data",
        rowCount: 1500000,
        columns: [
          { name: "SaleID", type: "INT", nullable: false, isPrimary: true },
          { name: "Date", type: "DATE", nullable: false, isPrimary: false },
          { name: "ProductID", type: "INT", nullable: false, isPrimary: false },
          {
            name: "CustomerID",
            type: "INT",
            nullable: false,
            isPrimary: false,
          },
          { name: "Quantity", type: "INT", nullable: false, isPrimary: false },
          {
            name: "Price",
            type: "DECIMAL(10,2)",
            nullable: false,
            isPrimary: false,
          },
        ],
      },
      {
        id: "2",
        name: "CUSTOMER",
        schema: "DBO",
        industryId: 1,
        description: "Contains customer information",
        rowCount: 50000,
        columns: [
          { name: "CustomerID", type: "INT", nullable: false, isPrimary: true },
          {
            name: "Name",
            type: "VARCHAR(100)",
            nullable: false,
            isPrimary: false,
          },
          {
            name: "Email",
            type: "VARCHAR(100)",
            nullable: true,
            isPrimary: false,
          },
          {
            name: "Phone",
            type: "VARCHAR(20)",
            nullable: true,
            isPrimary: false,
          },
          {
            name: "Address",
            type: "VARCHAR(255)",
            nullable: true,
            isPrimary: false,
          },
        ],
      },
      {
        id: "3",
        name: "PRODUCT",
        schema: "DBO",
        industryId: 1,
        description: "Contains product information",
        rowCount: 10000,
        columns: [
          { name: "ProductID", type: "INT", nullable: false, isPrimary: true },
          {
            name: "Name",
            type: "VARCHAR(100)",
            nullable: false,
            isPrimary: false,
          },
          {
            name: "Category",
            type: "VARCHAR(50)",
            nullable: false,
            isPrimary: false,
          },
          {
            name: "Price",
            type: "DECIMAL(10,2)",
            nullable: false,
            isPrimary: false,
          },
          {
            name: "InStock",
            type: "BOOLEAN",
            nullable: false,
            isPrimary: false,
          },
        ],
      },
      {
        id: "4",
        name: "CLAIMS",
        schema: "DBO",
        industryId: 2,
        description: "Contains insurance claims data",
        rowCount: 750000,
        columns: [
          { name: "ClaimID", type: "INT", nullable: false, isPrimary: true },
          { name: "PatientID", type: "INT", nullable: false, isPrimary: false },
          {
            name: "ProviderID",
            type: "INT",
            nullable: false,
            isPrimary: false,
          },
          {
            name: "ServiceDate",
            type: "DATE",
            nullable: false,
            isPrimary: false,
          },
          {
            name: "Amount",
            type: "DECIMAL(10,2)",
            nullable: false,
            isPrimary: false,
          },
          {
            name: "Status",
            type: "VARCHAR(20)",
            nullable: false,
            isPrimary: false,
          },
        ],
      },
    ];

    // Filter tables by industryId if provided
    const filteredTables = industryId
      ? mockTables.filter((table) => table.industryId === parseInt(industryId))
      : mockTables;

    return res.json({
      success: true,
      data: filteredTables,
    });
  } catch (error) {
    logger.error("Error fetching database tables:", error);
    next(error);
  }
};

/**
 * Get users with access to the system - now DB only (Azure AD removed)
 * @route GET /api/admin/users
 */
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const numericLimit = Number(limit) || 50;
    const numericPage = Number(page) || 1;
    const offset = (numericPage - 1) * numericLimit;
    const username = req.user?.username;

    if (!username) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // DB-only search condition
    const searchCondition = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    // Fetch users from DB
    const users = await Users.findAndCountAll({
      where: searchCondition,
      offset,
      limit: numericLimit,
      order: [["user_name", "ASC"]],
      include: [
        {
          model: UserAccess,
          as: "UserAccesses",
          include: [
            { model: Industry, as: "Industry" },
            { model: Persona, as: "Persona" },
            { model: Client, as: "Client" },
          ],
        },
      ],
    });

    // Same formatting logic as your old DB fallback
    const processedUsers = await Promise.all(
      users.rows.map(async (user) => {
        const userJson = user.toJSON ? user.toJSON() : user;

        if (userJson.UserAccesses) {
          const industries = [];

          userJson.UserAccesses.forEach((access) => {
            const existingIndustry = industries.find(
              (ind) => ind.id === access.Industry?.industry_id
            );

            if (access.Industry) {
              if (existingIndustry) {
                // Add persona if not already present
                if (
                  access.Persona &&
                  !existingIndustry.personas.some(
                    (p) => p.id === access.Persona?.persona_id
                  )
                ) {
                  existingIndustry.personas.push({
                    id: access.Persona.persona_id,
                    name: access.Persona.persona,
                  });
                }
              } else {
                industries.push({
                  id: access.Industry.industry_id,
                  name: access.Industry.industry_name,
                  personas: access.Persona
                    ? [
                        {
                          id: access.Persona.persona_id,
                          name: access.Persona.persona,
                        },
                      ]
                    : [],
                });
              }
            }
          });

          userJson.industries = industries;
        }

        delete userJson.UserAccesses;
        return userJson;
      })
    );

    return res.json({
      success: true,
      data: processedUsers,
      total: users.count,
      page: numericPage,
      limit: numericLimit,
      totalPages: Math.ceil(users.count / numericLimit),
      source: "database", // keep `source` field but now always DB
    });
  } catch (error) {
    logger.error("Error fetching users:", error);
    next(error);
  }
};

/**
 * Create or update a user - For database users only
 * @route POST /api/admin/users
 */
exports.updateUser = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id, email, name, industries } = req.body;
    const username = req.user?.username;

    if (!username) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!email || !name) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Email and name are required",
      });
    }

    let user;

    // Check if this is an update or create operation
    if (id) {
      // Check if this looks like an Azure AD GUID – prevent accidental edits of legacy AD users
      const isAzureADId = id.match(
        /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/
      );

      if (isAzureADId) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Azure AD users must be updated in the Azure portal",
        });
      }

      // Update existing database user
      user = await Users.findByPk(id, { transaction });

      if (!user) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Update user properties
      await user.update(
        {
          email,
          name,
          updated_at: new Date(),
          updated_by: username,
        },
        { transaction }
      );
    } else {
      // Create new database user
      user = await Users.create(
        {
          email,
          name,
          created_at: new Date(),
          created_by: username,
          updated_at: new Date(),
          updated_by: username,
        },
        { transaction }
      );
    }

    // Handle industry and persona relationships if provided
    if (industries && Array.isArray(industries)) {
      // Remove existing access records for this user
      await UserAccess.destroy({
        where: { user_id: user.user_id },
        transaction,
      });

      // Add new access records
      for (const industry of industries) {
        if (industry.id) {
          const personas = industry.personas || [];

          for (const persona of personas) {
            if (persona.id) {
              await UserAccess.create(
                {
                  user_id: user.user_id,
                  industry_id: industry.id,
                  persona_id: persona.id,
                  client_id: industry.clientId || 1, // Default to clientId 1 if not specified
                  data_source_id: 1, // Default data source ID
                  created_at: new Date(),
                  updated_at: new Date(),
                },
                { transaction }
              );
            }
          }
        }
      }
    }

    await transaction.commit();

    // Fetch the user again with their relationships to return complete data
    const updatedUser = await Users.findByPk(user.user_id, {
      include: [
        {
          model: UserAccess,
          as: "UserAccesses",
          include: [
            { model: Industry, as: "Industry" },
            { model: Persona, as: "Persona" },
            { model: Client, as: "Client" },
          ],
        },
      ],
    });

    // Process user data to add formatted industries
    const userJson = updatedUser.toJSON();
    const formattedIndustries = [];

    if (userJson.UserAccesses) {
      userJson.UserAccesses.forEach((access) => {
        const existingIndustry = formattedIndustries.find(
          (ind) => ind.id === access.Industry?.industry_id
        );

        if (access.Industry) {
          if (existingIndustry) {
            if (
              access.Persona &&
              !existingIndustry.personas.some(
                (p) => p.id === access.Persona?.persona_id
              )
            ) {
              existingIndustry.personas.push({
                id: access.Persona.persona_id,
                name: access.Persona.persona,
              });
            }
          } else {
            formattedIndustries.push({
              id: access.Industry.industry_id,
              name: access.Industry.industry_name,
              personas: access.Persona
                ? [
                    {
                      id: access.Persona.persona_id,
                      name: access.Persona.persona,
                    },
                  ]
                : [],
            });
          }
        }
      });
    }

    userJson.industries = formattedIndustries;
    delete userJson.UserAccesses;

    return res.json({
      success: true,
      message: id ? "User updated successfully" : "User created successfully",
      data: userJson,
    });
  } catch (error) {
    await transaction.rollback();
    logger.error("Error updating user:", error);
    next(error);
  }
};

/**
 * Get a specific user by ID - DB only (Azure AD removed)
 * @route GET /api/admin/users/:userId
 */
exports.getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const username = req.user?.username;

    if (!username) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    logger.info(`Fetching user ${userId} from database`);

    const dbUser = await Users.findByPk(userId, {
      include: [
        {
          model: UserAccess,
          as: "UserAccesses",
          include: [
            { model: Industry, as: "Industry" },
            { model: Persona, as: "Persona" },
            { model: Client, as: "Client" },
          ],
        },
      ],
    });

    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userJson = dbUser.toJSON();
    const formattedIndustries = [];

    if (userJson.UserAccesses) {
      userJson.UserAccesses.forEach((access) => {
        const existingIndustry = formattedIndustries.find(
          (ind) => ind.id === access.Industry?.industry_id
        );

        if (access.Industry) {
          if (existingIndustry) {
            if (
              access.Persona &&
              !existingIndustry.personas.some(
                (p) => p.id === access.Persona?.persona_id
              )
            ) {
              existingIndustry.personas.push({
                id: access.Persona.persona_id,
                name: access.Persona.persona,
              });
            }
          } else {
            formattedIndustries.push({
              id: access.Industry.industry_id,
              name: access.Industry.industry_name,
              personas: access.Persona
                ? [
                    {
                      id: access.Persona.persona_id,
                      name: access.Persona.persona,
                    },
                  ]
                : [],
            });
          }
        }
      });
    }

    userJson.industries = formattedIndustries;
    delete userJson.UserAccesses;

    return res.json({
      success: true,
      data: userJson,
      source: "database",
    });
  } catch (error) {
    logger.error(`Error fetching user ${req.params.userId}:`, error);
    next(error);
  }
};

/**
 * Reset user access permissions
 * @route POST /api/admin/users/:userId/reset
 */
exports.resetUserAccess = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { userId } = req.params;
    const adminUsername = req.user?.username;

    if (!adminUsername) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!userId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Check if user exists
    const user = await Users.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: `User with ID ${userId} not found`,
      });
    }

    // Delete all user access entries
    const deletedCount = await UserAccess.destroy({
      where: { user_id: userId },
      transaction,
    });

    await transaction.commit();

    return res.json({
      success: true,
      message: `User access reset successfully. ${deletedCount} access entries removed.`,
      data: {
        userId,
        entriesRemoved: deletedCount,
      },
    });
  } catch (error) {
    await transaction.rollback();
    logger.error("Error resetting user access:", error);
    next(error);
  }
};

/**
 * Get system status information
 * @route GET /api/admin/system-status
 */
exports.getSystemStatus = async (req, res, next) => {
  try {
    const username = req.user?.username;

    if (!username) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Test database connection
    let databaseStatus = "disconnected";
    try {
      await sequelize.authenticate();
      databaseStatus = "connected";
    } catch (dbError) {
      logger.error("Database connection error:", dbError);
      databaseStatus = "error";
    }

    // Azure AD integration removed – mark as disabled in status
    const azureAdStatus = "disabled";
    const azureAdDetails = {
      message:
        "Azure AD / Microsoft Graph integration is disabled. System uses Okta + local DB.",
      error: null,
    };

    // Simplified BI services status check
    const biServicesStatus = "online"; // Could be enhanced with actual checks

    // Get uptime in hours
    const uptime = Math.floor(process.uptime() / 3600);

    // Get node version
    const nodeVersion = process.version;

    // Get disk usage (simplified)
    const diskUsage = 65; // Placeholder – can be replaced with actual check

    return res.json({
      success: true,
      data: {
        apiServerStatus: "online",
        databaseStatus,
        azureAdStatus,
        azureAdDetails,
        biServicesStatus,
        metrics: {
          diskUsage,
        },
        versions: {
          nodeVersion,
        },
        uptime,
      },
    });
  } catch (error) {
    logger.error("Error getting system status:", error);
    next(error);
  }
};

/**
 * Get recent system activities
 * @route GET /api/admin/recent-activities
 */
exports.getRecentActivities = async (req, res, next) => {
  try {
    const username = req.user?.username;
    const { industryId } = req.query;

    if (!username) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Mock data for recent activities
    // In a real implementation, these would come from a database table
    const mockActivities = [
      {
        id: "act1",
        type: "user_login",
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        user: "admin@example.com",
        details: {
          ip: "192.168.1.100",
          browser: "Chrome 98.0.4758.102",
        },
        industryId: 1,
      },
      {
        id: "act2",
        type: "dashboard_refresh",
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        user: "analyst@example.com",
        details: {
          dashboardId: "dashboard123",
          duration: "2.5s",
        },
        industryId: 1,
      },
      {
        id: "act3",
        type: "user_created",
        timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
        user: "admin@example.com",
        details: {
          newUser: "newuser@example.com",
        },
        industryId: 2,
      },
      {
        id: "act4",
        type: "report_exported",
        timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
        user: "manager@example.com",
        details: {
          reportId: "report456",
          format: "PDF",
          pages: 15,
        },
        industryId: 2,
      },
      {
        id: "act5",
        type: "system_error",
        timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
        user: "system",
        details: {
          error: "Database connection timeout",
          component: "DataService",
        },
        industryId: null, // System-wide error
      },
    ];

    // Filter by industryId if provided
    const filteredActivities = industryId
      ? mockActivities.filter(
          (activity) =>
            activity.industryId === parseInt(industryId) ||
            activity.industryId === null
        )
      : mockActivities;

    return res.json({
      success: true,
      data: filteredActivities,
    });
  } catch (error) {
    logger.error("Error fetching recent activities:", error);
    next(error);
  }
};

/**
 * Get application configuration
 * @route GET /api/admin/config
 */
exports.getAppConfig = async (req, res, next) => {
  try {
    const username = req.user?.username;
    const { industryId } = req.query;

    if (!username) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Mock application configuration data
    // In a real implementation, this would come from a database or configuration files
    const mockConfig = {
      general: {
        appName: "DeepThought Insights Platform",
        environment: process.env.NODE_ENV || "development",
        version: "1.0.0",
      },
      features: {
        enableDataExports: true,
        enableUserRegistration: false,
        enableAIInsights: true,
        enableRealTimeUpdates: true,
      },
      security: {
        sessionTimeout: 3600, // seconds
        maxLoginAttempts: 5,
        passwordPolicy: {
          minLength: 8,
          requireNumbers: true,
          requireSpecialChars: true,
          requireUppercase: true,
          expiryDays: 90,
        },
      },
      industries: [
        {
          id: 1,
          name: "CPG",
          settings: {
            defaultDashboard: "overview",
            refreshInterval: 15, // minutes
          },
        },
        {
          id: 2,
          name: "Pharma",
          settings: {
            defaultDashboard: "sales",
            refreshInterval: 30, // minutes
          },
        },
      ],
    };

    // Filter by industryId if provided
    if (industryId) {
      const filteredIndustries = mockConfig.industries.filter(
        (industry) => industry.id === parseInt(industryId)
      );
      mockConfig.industries = filteredIndustries;
    }

    return res.json({
      success: true,
      data: mockConfig,
    });
  } catch (error) {
    logger.error("Error fetching application configuration:", error);
    next(error);
  }
};

/**
 * Update application configuration
 * @route POST /api/admin/config
 */
exports.updateAppConfig = async (req, res, next) => {
  try {
    const { config } = req.body;
    const username = req.user?.username;

    if (!username) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!config) {
      return res.status(400).json({
        success: false,
        message: "Configuration data is required",
      });
    }

    // In a real implementation, this would validate and update the configuration
    // in database or configuration files
    logger.info(`Config update requested by ${username}:`, config);

    // Return the updated config as if it was saved
    return res.json({
      success: true,
      message: "Configuration updated successfully",
      data: config,
    });
  } catch (error) {
    logger.error("Error updating application configuration:", error);
    next(error);
  }
};
