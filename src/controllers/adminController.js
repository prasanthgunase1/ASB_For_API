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

/**
 * Small helper (same idea like your dashboardroutes headers)
 * Use cache="no-store" for user/secure endpoints, cache="public, max-age=86400" for config endpoints.
 */
function setAwsJsonHeaders(res, cache = "no-store") {
  res.set({
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
    "Cache-Control": cache,
    "X-Content-Type-Options": "nosniff",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  });
}

/**
 * Get all personas for the authenticated user or filtered by industry
 * @route GET /api/admin/personas
 */
exports.getPersonas = async (req, res, next) => {
  try {
    setAwsJsonHeaders(res, "no-store");

    const { industryId } = req.query;
    const username = req.user?.username;

    if (!username) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const queryOptions = {
      include: [],
      order: [["persona", "ASC"]],
    };

    if (industryId) {
      queryOptions.include.push({
        model: UserAccess,
        as: "UserAccesses",
        required: true,
        where: { industry_id: industryId },
        attributes: [],
      });
    }

    const personas = await Persona.findAll(queryOptions);

    const formattedPersonas = personas.map((persona) => {
      let parsedKPIs = [];
      let parsedHomeSummary = null;

      if (persona.KPIs) {
        try {
          const kpisStr = String(persona.KPIs).trim();
          if (
            (kpisStr.startsWith("{") && kpisStr.endsWith("}")) ||
            (kpisStr.startsWith("[") && kpisStr.endsWith("]"))
          ) {
            parsedKPIs = JSON.parse(kpisStr);
          } else {
            parsedKPIs = [{ name: "KPI", value: kpisStr }];
            logger.debug(
              `KPIs for persona ${persona.persona_id} is not in JSON format`
            );
          }
        } catch (error) {
          logger.debug(
            `Error parsing KPIs for persona ${persona.persona_id}:`,
            error
          );
          parsedKPIs = [{ name: "KPI", value: String(persona.KPIs) }];
        }
      }

      if (persona.home_exec_summary) {
        try {
          const summaryStr = String(persona.home_exec_summary).trim();
          if (
            (summaryStr.startsWith("{") && summaryStr.endsWith("}")) ||
            (summaryStr.startsWith("[") && summaryStr.endsWith("]"))
          ) {
            parsedHomeSummary = JSON.parse(summaryStr);
          } else {
            parsedHomeSummary = { content: summaryStr };
            logger.debug(
              `home_exec_summary for persona ${persona.persona_id} is not in JSON format`
            );
          }
        } catch (error) {
          logger.debug(
            `Error parsing home_exec_summary for persona ${persona.persona_id}:`,
            error
          );
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
    setAwsJsonHeaders(res, "no-store");

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

    const personaData = {
      persona: name,
      persona_context: context || null,
      KPIs: KPIs ? JSON.stringify(KPIs) : null,
      home_exec_summary: homeSummary ? JSON.stringify(homeSummary) : null,
      insights_exec_summary: insightsSummary || null,
    };

    let personaRecord;

    if (id) {
      personaRecord = await Persona.findByPk(id, { transaction });
      if (!personaRecord) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Persona not found",
        });
      }
      await personaRecord.update(personaData, { transaction });
    } else {
      personaRecord = await Persona.create(personaData, { transaction });

      await UserAccess.create(
        {
          persona_id: personaRecord.persona_id,
          industry_id: industryId,
          client_id: 0,
          user_id: 0,
          data_source_id: 0,
        },
        { transaction }
      );
    }

    await transaction.commit();

    let parsedKPIs = [];
    let parsedHomeSummary = null;

    try {
      parsedKPIs = personaRecord.KPIs ? JSON.parse(personaRecord.KPIs) : [];
    } catch (error) {
      logger.warn(`Failed to parse KPIs for response: ${error.message}`);
    }

    try {
      parsedHomeSummary = personaRecord.home_exec_summary
        ? JSON.parse(personaRecord.home_exec_summary)
        : null;
    } catch (error) {
      logger.warn(
        `Failed to parse home_exec_summary for response: ${error.message}`
      );
    }

    return res.json({
      success: true,
      message: id ? "Persona updated successfully" : "Persona created successfully",
      data: {
        id: personaRecord.persona_id,
        name: personaRecord.persona,
        context: personaRecord.persona_context,
        KPIs: parsedKPIs,
        homeSummary: parsedHomeSummary,
        insightsSummary: personaRecord.insights_exec_summary,
        createdAt: personaRecord.created_at,
        updatedAt: personaRecord.updated_at,
        industryId: parseInt(industryId, 10),
      },
    });
  } catch (error) {
    await transaction.rollback();
    logger.error("Error updating persona:", error);
    next(error);
  }
};

/**
 * ✅ BI dashboards disabled (PowerBI + MicroStrategy removed)
 * Keep the endpoint so frontend/routes won’t break.
 * @route GET /api/admin/bi-dashboards
 */
exports.getBiDashboards = async (req, res, next) => {
  try {
    setAwsJsonHeaders(res, "public, max-age=86400");

    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    return res.json({
      success: true,
      data: [],
      message: "BI dashboards are disabled (PowerBI/MicroStrategy removed).",
    });
  } catch (error) {
    logger.error("Error fetching BI dashboards:", error);
    next(error);
  }
};

/**
 * ✅ BI dashboards update disabled
 * @route POST /api/admin/bi-dashboards
 */
exports.updateBiDashboard = async (req, res, next) => {
  try {
    setAwsJsonHeaders(res, "no-store");

    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    return res.status(501).json({
      success: false,
      message: "BI dashboards are disabled (PowerBI/MicroStrategy removed).",
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
    setAwsJsonHeaders(res, "public, max-age=86400");

    const { industryId } = req.query;
    const username = req.user?.username;

    if (!username) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

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
          { name: "CustomerID", type: "INT", nullable: false, isPrimary: false },
          { name: "Quantity", type: "INT", nullable: false, isPrimary: false },
          { name: "Price", type: "DECIMAL(10,2)", nullable: false, isPrimary: false },
        ],
      },
    ];

    const filteredTables = industryId
      ? mockTables.filter((table) => table.industryId === parseInt(industryId, 10))
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
 * Get users with access to the system - DB only
 * @route GET /api/admin/users
 */
exports.getUsers = async (req, res, next) => {
  try {
    setAwsJsonHeaders(res, "no-store");

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

    const searchCondition = search
      ? {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ],
      }
      : {};

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

    const processedUsers = await Promise.all(
      users.rows.map(async (userRow) => {
        const userJson = userRow.toJSON ? userRow.toJSON() : userRow;

        if (userJson.UserAccesses) {
          const industries = [];

          userJson.UserAccesses.forEach((accessRow) => {
            const industryFromAccess = accessRow.Industry;
            const personaFromAccess = accessRow.Persona;

            const existingIndustry = industries.find(
              (ind) => ind.id === industryFromAccess?.industry_id
            );

            if (industryFromAccess) {
              if (existingIndustry) {
                if (
                  personaFromAccess &&
                  !existingIndustry.personas.some((p) => p.id === personaFromAccess?.persona_id)
                ) {
                  existingIndustry.personas.push({
                    id: personaFromAccess.persona_id,
                    name: personaFromAccess.persona,
                  });
                }
              } else {
                industries.push({
                  id: industryFromAccess.industry_id,
                  name: industryFromAccess.industry_name,
                  personas: personaFromAccess
                    ? [{ id: personaFromAccess.persona_id, name: personaFromAccess.persona }]
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
      source: "database",
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
    setAwsJsonHeaders(res, "no-store");

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

    let userRecord;

    if (id) {
      const isAWADId = id.match(
        /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/
      );

      if (isAWADId) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Legacy Azure AD users cannot be edited here",
        });
      }

      userRecord = await Users.findByPk(id, { transaction });
      if (!userRecord) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      await userRecord.update(
        { email, name, updated_at: new Date(), updated_by: username },
        { transaction }
      );
    } else {
      userRecord = await Users.create(
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

    if (industries && Array.isArray(industries)) {
      await UserAccess.destroy({
        where: { user_id: userRecord.user_id },
        transaction,
      });

      for (const industryItem of industries) {
        if (!industryItem?.id) continue;

        const personasList = industryItem.personas || [];
        for (const personaItem of personasList) {
          if (!personaItem?.id) continue;

          await UserAccess.create(
            {
              user_id: userRecord.user_id,
              industry_id: industryItem.id,
              persona_id: personaItem.id,
              client_id: industryItem.clientId || 1,
              data_source_id: 1,
              created_at: new Date(),
              updated_at: new Date(),
            },
            { transaction }
          );
        }
      }
    }

    await transaction.commit();

    const updatedUser = await Users.findByPk(userRecord.user_id, {
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

    const userJson = updatedUser.toJSON();
    const formattedIndustries = [];

    if (userJson.UserAccesses) {
      userJson.UserAccesses.forEach((accessRow) => {
        const industryFromAccess = accessRow.Industry;
        const personaFromAccess = accessRow.Persona;

        const existingIndustry = formattedIndustries.find(
          (ind) => ind.id === industryFromAccess?.industry_id
        );

        if (industryFromAccess) {
          if (existingIndustry) {
            if (
              personaFromAccess &&
              !existingIndustry.personas.some((p) => p.id === personaFromAccess?.persona_id)
            ) {
              existingIndustry.personas.push({
                id: personaFromAccess.persona_id,
                name: personaFromAccess.persona,
              });
            }
          } else {
            formattedIndustries.push({
              id: industryFromAccess.industry_id,
              name: industryFromAccess.industry_name,
              personas: personaFromAccess
                ? [{ id: personaFromAccess.persona_id, name: personaFromAccess.persona }]
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
 * Get a specific user by ID - DB only
 * @route GET /api/admin/users/:userId
 */
exports.getUserById = async (req, res, next) => {
  try {
    setAwsJsonHeaders(res, "no-store");

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
      userJson.UserAccesses.forEach((accessRow) => {
        const industryFromAccess = accessRow.Industry;
        const personaFromAccess = accessRow.Persona;

        const existingIndustry = formattedIndustries.find(
          (ind) => ind.id === industryFromAccess?.industry_id
        );

        if (industryFromAccess) {
          if (existingIndustry) {
            if (
              personaFromAccess &&
              !existingIndustry.personas.some((p) => p.id === personaFromAccess?.persona_id)
            ) {
              existingIndustry.personas.push({
                id: personaFromAccess.persona_id,
                name: personaFromAccess.persona,
              });
            }
          } else {
            formattedIndustries.push({
              id: industryFromAccess.industry_id,
              name: industryFromAccess.industry_name,
              personas: personaFromAccess
                ? [{ id: personaFromAccess.persona_id, name: personaFromAccess.persona }]
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
    setAwsJsonHeaders(res, "no-store");

    const { userId } = req.params;
    const adminUsername = req.user?.username;

    if (!adminUsername) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userRecord = await Users.findByPk(userId, { transaction });
    if (!userRecord) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: `User with ID ${userId} not found`,
      });
    }

    const deletedCount = await UserAccess.destroy({
      where: { user_id: userId },
      transaction,
    });

    await transaction.commit();

    return res.json({
      success: true,
      message: `User access reset successfully. ${deletedCount} access entries removed.`,
      data: { userId, entriesRemoved: deletedCount },
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
    setAwsJsonHeaders(res, "no-store");

    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    let databaseStatus = "disconnected";
    try {
      await sequelize.authenticate();
      databaseStatus = "connected";
    } catch (dbError) {
      logger.error("Database connection error:", dbError);
      databaseStatus = "error";
    }

    // ✅ Azure AD removed
    const externalDirectoryStatus = "disabled";
    const externalDirectoryDetails = {
      message: "Azure AD / Microsoft Graph integration is disabled. System uses Okta + local DB.",
      error: null,
    };

    // ✅ BI disabled
    const biServicesStatus = "disabled";

    const uptime = Math.floor(process.uptime() / 3600);
    const nodeVersion = process.version;

    return res.json({
      success: true,
      data: {
        apiServerStatus: "online",
        databaseStatus,
        externalDirectoryStatus,
        externalDirectoryDetails,
        biServicesStatus,
        metrics: { diskUsage: 65 },
        versions: { nodeVersion },
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
    setAwsJsonHeaders(res, "no-store");

    const username = req.user?.username;
    const { industryId } = req.query;

    if (!username) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const mockActivities = [
      {
        id: "act-001",
        type: "user_login",
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        user: "user@demo.com",
        details: {
          ip: "0.0.0.0",          // neutral / non-real IP
          browser: "Chrome",
        },
        industryId: 1,
      },
    ];


    const filteredActivities = industryId
      ? mockActivities.filter(
        (activity) =>
          activity.industryId === parseInt(industryId, 10) ||
          activity.industryId === null
      )
      : mockActivities;

    return res.json({ success: true, data: filteredActivities });
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
    setAwsJsonHeaders(res, "public, max-age=86400");

    const username = req.user?.username;
    const { industryId } = req.query;

    if (!username) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

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
        sessionTimeout: 3600,
        maxLoginAttempts: 5,
      },
      industries: [
        { id: 1, name: "CPG", settings: { defaultDashboard: "overview" } },
        { id: 2, name: "Pharma", settings: { defaultDashboard: "sales" } },
      ],
    };

    if (industryId) {
      mockConfig.industries = mockConfig.industries.filter(
        (industry) => industry.id === parseInt(industryId, 10)
      );
    }

    return res.json({ success: true, data: mockConfig });
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
    setAwsJsonHeaders(res, "no-store");

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

    logger.info(`Config update requested by ${username}:`, config);

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
