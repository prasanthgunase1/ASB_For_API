const {
  HomeScreen,
  Persona,
  InsightsScreen,
  sequelize,
} = require("../db/models");
const { Op } = require("sequelize");
const {
  searchInsightsByPersona,
  searchInsightById,
  updateInsightAnomalySearch,
  searchInsightDataById,
} = require("../utils/azureSearchHelper");
const { callDashboardAPI } = require("../services/agentService");
const { endpoints } = require("../config/config");
const fetch = require("node-fetch").default;
const axios = require("axios");


exports.getInsightDetails = async (req, res, next) => {
  try {
    const personaId = req.query.personaId;
    if (!personaId) {
      return res.status(400).json({
        success: false,
        message: "personaId is required",
      });
    }

    const searchDetails = await searchInsightsByPersona(personaId);

    res.json({
      success: true,
      data: searchDetails,
    });
  } catch (error) {
    next(error);
  }
};

// OPTIMIZED: Removed dataDictionary API call to improve performance
// exports.homeDashboard = async (req, res, next) => {
//   try {
//     const { personaId, userId, clientId } = req.query;

//     if (!personaId || !userId || !clientId) {
//       throw new Error("Persona ID, User ID, and Client ID are required");
//     }

//     // PERFORMANCE OPTIMIZATION: Direct database query with minimal includes
//     const result = await HomeScreen.findAll({
//       include: [
//         {
//           model: Persona,
//           where: { persona_id: personaId },
//           attributes: [], // Don't select persona attributes to reduce payload
//           through: { attributes: [] }, // Don't select through table attributes
//         },
//       ],
//       where: { status: "Y" },
//       attributes: [
//         "visual_id",
//         "visual_link",
//         "visual_title",
//         "visual_summary",
//         "visual_type",
//         "current_value",
//         "is_positive_trend",
//         "percent_change",
//         "period_type",
//         "data_points",
//         "priority",
//         "preference",
//         "python_code",
//         "sql_query",
//         "created_at",
//         "updated_at",
//       ],
//       order: [
//         ["priority", "ASC"],
//         ["preference", "ASC"],
//       ], // Add ordering for consistent results
//       raw: false, // Keep as Sequelize instances for proper JSON serialization
//     });

//     // Optional: Call dataDictionary API asynchronously without blocking response
//     // This runs in background and doesn't affect response time
//     if (process.env.ENABLE_BACKGROUND_DATA_DICTIONARY === "true") {
//       setImmediate(async () => {
//         try {
//           const payload = {
//             user_id: [parseInt(userId)],
//             persona_id: [parseInt(personaId)],
//             override_flag:false
//           };

//           const res=await fetch(endpoints.dataDictionary, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(payload),
//             timeout: 30000,
//           });
//           console.log(
//             "Data dictionary called:",
//             payload,
//             ": api:",
//             endpoints.dataDictionary,
          
//           );
//         } catch (bgError) {
//           console.warn(
//             "Background dataDictionary call failed:",
//             bgError.message
//           );
//         }
//       });
//     }

//     res.json({
//       success: true,
//       data: result,
//     });
//   } catch (error) {
//     console.error("Home Dashboard Error:", error);
//     next(error);
//   }
// };
// In controllers/dashboardController.js

exports.homeDashboard = async (req, res, next) => {
  try {
    const { personaId, userId, clientId } = req.query;

    if (!personaId || !userId || !clientId) {
      throw new Error("Persona ID, User ID, and Client ID are required");
    }

    // --- 1. Fetch all necessary visual data (Core Dashboard Data) ---
    const visualResults = await HomeScreen.findAll({
      include: [
        {
          model: Persona,
          where: { persona_id: personaId },
          attributes: [],
          through: { attributes: [] },
        },
      ],
      where: { status: "Y" },
      attributes: [
        "visual_id",
        "visual_link",
        "visual_title",
        "visual_summary",
        "visual_type",
        "current_value",
        "is_positive_trend",
        "percent_change",
        "period_type",
        "data_points", // Assuming this contains the chart data
      ],
      order: [
        ["priority", "ASC"], // Use existing ordering for structured fetch
        ["preference", "ASC"],
      ],
      raw: true, // Use raw:true for a simpler, faster payload
    });
    
    // --- 2. Structure the data to match the UI sections ---
    const structuredData = {
      // --- Top Header Metrics (Aggregated from Visuals or a separate source) ---
      // NOTE: These top metrics are typically summary KPIs fetched from a dedicated source.
      // For this rewrite, we'll try to extract them if they exist in the visual data.
      topMetrics: {
        depositBalance: visualResults.find(v => v.visual_title === 'Deposit Balance')?.current_value,
        loanOutstanding: visualResults.find(v => v.visual_title === 'Loan Outstanding')?.current_value || '1.2M',
        netProfit: visualResults.find(v => v.visual_title === 'Net Profit')?.current_value || '2.3M',
        creditUtilization: visualResults.find(v => v.visual_title === 'Credit Utilization')?.current_value || '60%',
      },

      // --- Score Cards ---
      scoreCards: {
        financialScore: {
          score: visualResults.find(v => v.visual_title === 'Financial Score')?.current_value || '8.1/10',
          trend: visualResults.find(v => v.visual_title === 'Financial Score')?.percent_change || '+1.0',
          status: 'Good',
        },
        relationshipScore: {
          score: visualResults.find(v => v.visual_title === 'Relationship Score')?.current_value || '8.6/10',
          status: 'Great',
        },
        riskStabilityScore: {
          score: visualResults.find(v => v.visual_title === 'Risk and Stability Score')?.current_value || '7.2/10',
          status: 'Low Risk',
        },
      },

      // --- Client Account Details Table ---
      clientAccountDetails: visualResults.filter(v => v.visual_type === 'table' && v.visual_title === 'Client Account Details').map(v => JSON.parse(v.data_points || '[]')).flat(), // Assuming the table data is in data_points
      
      // --- Chart Data (Extracting based on visual_title) ---
      charts: {
        depositTrends: visualResults.find(v => v.visual_title === 'Deposit Trends')?.data_points,
        loanOutstandingTrends: visualResults.find(v => v.visual_title === 'Loan Outstanding Trends')?.data_points,
        revenue: visualResults.find(v => v.visual_title === 'Revenue')?.data_points,
        totalPnlOfRelationship: visualResults.find(v => v.visual_title === 'Total P&L of Relationship (Profit)')?.data_points,
        revenueAndProfitsAtProductLevel: visualResults.find(v => v.visual_title === 'Revenue and Profits at Product Level')?.data_points,
        volumesOfUsage: visualResults.find(v => v.visual_title === 'Volumes of Usage')?.data_points,
      },
      
      // --- Engagement Details ---
      // This part is static text in the image, likely fetched from a separate 'Engagement' table or hardcoded.
      // Since it's not explicitly fetched in the original code, we'll placeholder it for completeness.
      engagementDetails: {
          lastMtgAttended: '20 Aug 2025',
          lastMaturityDate: '08/20/2023',
          upcomingQuarterlyReview: '08/25/2025',
          upcomingAnnualReview: '12/20/2025',
      },
      
      // --- Other Contact Teams ---
      otherAsbTeams: [
          { name: 'Name of the Team', contact: 'name.lastname@email.com' },
          { name: 'Name of the Team', contact: 'name.lastname@email.com' },
          { name: 'Name of the Team', contact: 'name.lastname@email.com' },
      ]
    };
    
    // The original code optionally calls dataDictionary API in the background
    if (process.env.ENABLE_BACKGROUND_DATA_DICTIONARY === "true") {
      setImmediate(async () => {
        // ... (Original background logic for dataDictionary remains here) ...
        try {
          const payload = {
            user_id: [parseInt(userId)],
            persona_id: [parseInt(personaId)],
            override_flag:false
          };

          const res=await fetch(endpoints.dataDictionary, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            timeout: 30000,
          });
          console.log(
            "Data dictionary called:",
            payload,
            ": api:",
            endpoints.dataDictionary,
          
          );
        } catch (bgError) {
          console.warn(
            "Background dataDictionary call failed:",
            bgError.message
          );
        }
      });
    }

    res.json({
      success: true,
      data: structuredData, // Return the structured object
    });
  } catch (error) {
    console.error("Home Dashboard Error:", error);
    next(error);
  }
};



/**
 * Generate dashboard PPT and upload to Azure Blob Storage
 * @route POST /dashboard/dashboards_to_ppt
 */


exports.dashboardsToPpt = async (req, res, next) => {
  try {
    const { persona_id, visual_ids_lst } = req.body;

    if (!persona_id || !visual_ids_lst?.length) {
      return res.status(400).json({
        success: false,
        message: "persona_id and visual_ids_lst are required",
      });
    }

    // Forward request to Python service
    const pythonRes = await axios.post(
      endpoints.dashboardsToPpt,
      req.body,
      { headers: { "Content-Type": "application/json" } }
    );

    // Pass response back to frontend
    res.status(pythonRes.status).json(pythonRes.data);
  } catch (error) {
    console.error("Error in dashboardsToPpt:", error.message);
    next(error);
  }
};

exports.insightsToPpt = async (req, res, next) => {
  try {
    const { persona_id, insight_ids_lst } = req.body;

    if (!persona_id || !insight_ids_lst?.length) {
      return res.status(400).json({
        success: false,
        message: "persona_id and insight_ids_lst are required",
      });
    }

    // Forward request to Python service
    const pythonRes1 = await axios.post(
      endpoints.insightsToPpt,
      req.body,
      { headers: { "Content-Type": "application/json" }, responseType: "json"}
    );

    // Pass response back to frontend
    res.status(pythonRes1.status).json(pythonRes1.data);
  } catch (error) {
    console.error("Error in insightsToPpt:", error.message);
    next(error);
  }
};

// // OPTIMIZED: Simplified query with better error handling
// exports.homeSummary = async (req, res, next) => {
//   try {
//     const { personaId } = req.query;

//     if (!personaId) {
//       return res.status(400).json({
//         success: false,
//         message: "personaId is required",
//       });
//     }

//     // PERFORMANCE OPTIMIZATION: Use findByPk for faster lookup
//     const result = await Persona.findByPk(personaId, {
//       attributes: ["home_exec_summary"],
//       raw: true, // Return plain object for better performance
//     });

//     res.json({
//       success: true,
//       data: result ? [result] : [],
//     });
//   } catch (error) {
//     console.error("Home Summary Error:", error);
//     next(error);
//   }
// };


exports.homeSummary = async (req, res, next) => {
  try {
    const { personaId } = req.query;

    if (!personaId) {
      return res.status(400).json({
        success: false,
        message: "personaId is required",
      });
    }

    const query = `
      SELECT 
        hs.visual_title as title, 
        hs.visual_summary as summary
      FROM USR.HomeScreen hs
      INNER JOIN USR.HomeScreenPersonaRef hspr 
        ON hspr.visual_id = hs.visual_id
      WHERE hspr.persona_id = :personaId
        AND hs.status = 'Y'
      ORDER BY hs.priority, hs.preference
    `;

    const results = await sequelize.query(query, {
      replacements: { personaId },
      type: sequelize.QueryTypes.SELECT,
    });

    // Format the results to match the OLD structure
    const formattedData = {
      home_exec_summary: JSON.stringify(results) // 'results' is already an array of {title, summary} objects
    };

    res.json({
      success: true,
      data: [formattedData], // Wrap it in an array to match the old format exactly
    });
  } catch (error) {
    console.error("❌ Home Summary Error:", error.message);
    next(error);
  }
};

exports.resetVisual = async (req, res, next) => {
  try {
    const { personaId, userId } = req.query;

    if (!personaId || !userId) {
      return res.status(400).json({
        success: false,
        message: "personaId and userId are required",
      });
    }

    // OPTIMIZED: Use transaction for better performance and data consistency
    const result = await sequelize.transaction(async (t) => {
      // Reset HomeScreen visuals - Direct SQL for better performance
      await sequelize.query(
        `UPDATE USR.HomeScreen 
         SET status = 'N', updated_at = GETDATE() 
         WHERE visual_id IN (
           SELECT hs.visual_id 
           FROM USR.HomeScreen hs
           INNER JOIN USR.HomeScreenPersonaRef hspr ON hs.visual_id = hspr.visual_id
           WHERE hspr.persona_id = :personaId
         )`,
        {
          replacements: { personaId },
          type: sequelize.QueryTypes.UPDATE,
          transaction: t,
        }
      );

      // Reset InsightsScreen visuals
      await sequelize.query(
        `UPDATE USR.InsightsScreen 
         SET status = 'N', updated_at = GETDATE() 
         WHERE insight_id IN (
           SELECT insight_id 
           FROM USR.InsightsScreenPersonaRef 
           WHERE persona_id = :personaId
         )`,
        {
          replacements: { personaId },
          type: sequelize.QueryTypes.UPDATE,
          transaction: t,
        }
      );

      return { success: true };
    });

    // Call dashboard API asynchronously to not block response
    setImmediate(async () => {
      try {
        await callDashboardAPI({
          persona_id: parseInt(personaId),
          user_id: parseInt(userId),
        });
      } catch (apiError) {
        console.warn("Background dashboard API call failed:", apiError.message);
      }
    });

    res.json({
      success: true,
      message: "Visuals and insights reset successfully",
    });
  } catch (error) {
    console.error("Reset Visual Error:", error);
    next(error);
  }
};

exports.getNextUnrefreshedInsight = async (req, res, next) => {
  try {
    const { personaId, userId } = req.query;

    if (!personaId || !userId) {
      return res.status(400).json({
        success: false,
        message: "personaId and userId are required",
      });
    }

    const result = await InsightsScreen.findOne({
      include: [
        {
          model: Persona,
          where: { persona_id: personaId },
          attributes: [],
          through: { attributes: [] },
        },
      ],
      where: { status: "N" },
      limit: 1,
      order: [["insight_id", "ASC"]],
      attributes: [
        "insight_id",
        "sql_query",
        "insight_anomaly_data_points",
        "insight_title",
        "insight_brief",
        "insight_summary",
        "data_points",
      ],
    });

    res.json({
      success: true,
      data: result || {},
    });
  } catch (error) {
    next(error);
  }
};

// Update insight endpoint
exports.updateInsight = async (req, res, next) => {
  try {
    const insightData = req.body;

    if (!insightData.insight_id) {
      return res.status(400).json({
        success: false,
        message: "insight_id is required",
      });
    }

    // Stringify arrays/objects before saving
    const updatedData = {
      ...insightData,
      insight_faqs: Array.isArray(insightData.insight_faqs)
        ? JSON.stringify(insightData.insight_faqs)
        : insightData.insight_faqs,
      insight_anomaly_data_points: Array.isArray(
        insightData.insight_anomaly_data_points
      )
        ? JSON.stringify(insightData.insight_anomaly_data_points)
        : insightData.insight_anomaly_data_points,
      status: "Y",
    };

    // Remove any potentially problematic date fields
    delete updatedData.created_at;
    delete updatedData.updated_at;

    await InsightsScreen.update(updatedData, {
      where: { insight_id: insightData.insight_id },
      hooks: false,
      silent: true,
    });

    // Update timestamp separately using raw query if needed
    await sequelize.query(
      `UPDATE USR.InsightsScreen 
       SET updated_at = GETDATE() 
       WHERE insight_id = :insightId`,
      {
        replacements: { insightId: insightData.insight_id },
        type: sequelize.QueryTypes.UPDATE,
      }
    );

    res.json({
      success: true,
      message: "Insight updated successfully",
    });
  } catch (error) {
    console.error("Update insight error:", {
      error: error.message,
      stack: error.stack,
      data: req.body,
    });
    next(error);
  }
};

// Update insight anomaly in Azure Search
exports.updateInsightAnomaly = async (req, res, next) => {
  try {
    const { data, index } = req.body;

    if (!data || !index) {
      return res.status(400).json({
        success: false,
        message: "data and index are required",
      });
    }

    await updateInsightAnomalySearch(data, index);

    res.json({
      success: true,
      message: "Insight anomaly updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.getNextUnrefreshedAnomaly = async (req, res, next) => {
  try {
    const { insight_id, index } = req.query;

    if (!insight_id) {
      return res.status(400).json({
        success: false,
        message: "insight_id is required",
      });
    }

    if (!index) {
      return res.status(400).json({
        success: false,
        message: "index is required",
      });
    }

    const searchResult = await searchInsightById(
      insight_id,
      index.replace(/['"]+/g, "")
    );

    // Return more detailed response
    if (!searchResult || searchResult.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: "No anomaly data found for the given insight_id and index",
      });
    }

    res.json({
      success: true,
      data: searchResult,
    });
  } catch (error) {
    console.error("Anomaly search error:", error);

    const status = error.message.includes("Index name") ? 400 : 500;
    res.status(status).json({
      success: false,
      message: error.message,
      detail: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

exports.getNextUnrefreshedVisual = async (req, res, next) => {
  try {
    const { personaId, userId } = req.body;

    const result = await HomeScreen.findAll({
      include: [
        {
          model: Persona,
          where: { persona_id: personaId },
          attributes: [],
          through: { attributes: [] },
        },
      ],
      where: { status: "N" },
      limit: 1,
      attributes: [
        "visual_id",
        "visual_link",
        "visual_title",
        "visual_summary",
        "visual_type",
        "current_value",
        "is_positive_trend",
        "percent_change",
        "period_type",
        "data_points",
        "priority",
        "preference",
        "python_code",
        "sql_query",
      ],
    });
    res.json({
      success: true,
      data: result[0] || {},
    });
  } catch (error) {
    next(error);
  }
};

exports.updateVisual = async (req, res, next) => {
  try {
    const visualData = req.body;

    await HomeScreen.update(
      {
        ...visualData,
        status: "Y",
      },
      {
        where: { visual_id: visualData.visual_id },
      }
    );

    res.json({
      success: true,
      message: "Visual updated successfully",
    });
  } catch (error) {
    next(error);
  }
};


exports.insightsDashboard = async (req, res, next) => {
  try {
    const { personaId } = req.query;

    if (!personaId) {
      return res.status(400).json({
        success: false,
        message: "personaId is required",
      });
    }

    // Get insights from database
    const result = await InsightsScreen.findAll({
      include: [
        {
          model: Persona,
          where: { persona_id: personaId },
          attributes: [],
          through: { attributes: [] },
        },
      ],
      where: { status: "Y" },
      attributes: [
        "insight_id",
        "insight_title",
        "insight_brief",
        "insight_summary",
        "insight_faqs",
        "insight_anomaly_data_points",
        "data_points",
        "confidence_score",
        "explainability_summary",
        "sql_query",
        "insight_visual_link",
        "created_at",
        "updated_at",
      ],
      order: [["confidence_score", "DESC"]],
      raw: false,
    });

    // For each insight, try to get data from Azure Search index first
    const insightsWithData = await Promise.all(
      result.map(async (insight) => {
        const insightObj = insight.toJSON();

        try {
          // Try to get data from Azure Search index
          const searchData = await searchInsightDataById(
            insightObj.insight_id,
            process.env.INSIGHTS_DATA_INDEX || "insight-dataframe"
          );

          if (searchData && searchData.length > 0) {
            // Parse the data from Azure Search and embed directly in insight
            const parsedData = searchData[0].data;
            insightObj.query_result = parsedData;
            insightObj.query_execution_time = null;
            insightObj.query_loading = false;
            insightObj.query_error = null;

            console.log(
              `Found data in Azure Search for insight ${insightObj.insight_id}`
            );
          } else {
            // No data in Azure Search, will need to execute query later
            insightObj.query_result = [];
            insightObj.query_execution_time = null;
            insightObj.query_loading = false;
            insightObj.query_error = null;
          }
        } catch (searchError) {
          console.error(
            `Error searching Azure index for insight ${insightObj.insight_id}:`,
            searchError
          );
          // Fallback to empty result
          insightObj.query_result = [];
          insightObj.query_execution_time = null;
          insightObj.query_loading = false;
          insightObj.query_error = null;
        }

        // Determine has_query dynamically based on sql_query presence
        insightObj.has_query = !!(
          insightObj.sql_query && insightObj.sql_query.trim().length > 0
        );

        return insightObj;
      })
    );

    res.json({
      success: true,
      data: insightsWithData,
    });
  } catch (error) {
    console.error("Insights Dashboard Error:", error);
    next(error);
  }
};

exports.executeInsightQueries = async (req, res, next) => {
  try {
    const { personaId, queries } = req.body;

    if (!personaId || !queries || !Array.isArray(queries)) {
      return res.status(400).json({
        success: false,
        message: "personaId and queries array are required",
      });
    }

    console.log(
      `Processing ${queries.length} queries for persona ${personaId}`
    );

    // Filter out invalid queries
    const validQueries = queries.filter((q) => {
      if (!q.insight_id || !q.sql_query) {
        console.warn(`Skipping invalid query for insight ${q?.insight_id}`);
        return false;
      }
      return true;
    });

    // Execute queries sequentially to avoid timeout/resource issues
    const results = [];
    for (const query of validQueries) {
      try {
        // Parse SQL query if it's a JSON string
        let parsedQuery = query.sql_query;
        if (typeof query.sql_query === "string") {
          try {
            const queryObj = JSON.parse(query.sql_query);
            parsedQuery = queryObj.sql_query;
          } catch (e) {
            parsedQuery = query.sql_query;
          }
        }

        const startTime = Date.now();

        // Execute query with timeout
        const queryResult = await Promise.race([
          sequelize.query(parsedQuery, {
            type: sequelize.QueryTypes.SELECT,
            logging: false,
          }),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Query timeout after 30 seconds")),
              30000
            )
          ),
        ]);

        const executionTime = Date.now() - startTime;

        results.push({
          insight_id: query.insight_id,
          success: true,
          data: queryResult,
          execution_time: executionTime,
        });
      } catch (error) {
        console.error(`Query failed for insight ${query.insight_id}:`, {
          error: error.message,
          query: query.sql_query?.substring(0, 100),
        });

        results.push({
          insight_id: query.insight_id,
          success: false,
          error: error.message || "Query execution failed",
          data: null,
        });
      }

      // Add small delay between queries to prevent overload
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Calculate summary
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    console.log(
      `Execution completed: ${successCount} successful, ${failCount} failed`
    );

    return res.json({
      success: true,
      data: results,
      summary: {
        total: queries.length,
        successful: successCount,
        failed: failCount,
        skipped: queries.length - validQueries.length,
      },
    });
  } catch (error) {
    console.error("Error in executeInsightQueries:", error);
    next(error);
  }
};

exports.executeInsightQuery = async (req, res, next) => {
  try {
    const { insightId } = req.params;
    const { sql_query } = req.body;

    if (!insightId || !sql_query) {
      return res.status(400).json({
        success: false,
        message: "insightId and sql_query are required",
      });
    }

    const startTime = Date.now();

    // Parse SQL query if it's a JSON string
    let parsedQuery = sql_query;
    if (typeof sql_query === "string") {
      try {
        const queryObj = JSON.parse(sql_query);
        parsedQuery = queryObj.sql_query || sql_query;
      } catch (e) {
        parsedQuery = sql_query;
      }
    }

    console.log(
      `Executing query for insight ${insightId}:`,
      parsedQuery.substring(0, 100) + "..."
    );

    // Execute the SQL query
    const result = await sequelize.query(parsedQuery, {
      type: sequelize.QueryTypes.SELECT,
      timeout: 300000,
      searchPath: "RGM_BASE",
      queryHint: "OPTION(MAXDOP 4, OPTIMIZE FOR UNKNOWN)",
    });

    const executionTime = Date.now() - startTime;
    console.log(
      `Query for insight ${insightId} completed in ${executionTime}ms`
    );

    // Update the specific insight in the database or cache if needed
    // This ensures the next time insightsDashboard is called, it has the latest data

    return res.json({
      success: true,
      data: {
        insight_id: insightId,
        query_result: result || [],
        query_execution_time: executionTime,
        query_loading: false,
        query_error: null,
      },
    });
  } catch (error) {
    console.error(
      `Query execution failed for insight ${req.params.insightId}:`,
      error
    );

    if (
      error.name === "SequelizeDatabaseError" &&
      error.parent?.code === "ETIMEOUT"
    ) {
      return res.status(408).json({
        success: false,
        error:
          "Query exceeded time limit. Please try with a simpler query or contact support.",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Query execution failed",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.getAllVisualSummaries = async (req, res, next) => {
  try {
    const { personaId } = req.query;

    if (!personaId) {
      throw new Error("Persona ID is required");
    }

    const result = await Persona.findOne({
      where: { persona_id: personaId },
      attributes: ["persona"],
      include: [
        {
          model: HomeScreen,
          through: { attributes: [] },
          attributes: ["visual_title", "visual_summary"],
        },
      ],
    });

    if (!result) {
      return res.json({
        success: false,
        message: "No data found for given persona",
      });
    }

    const response = {
      persona: result.persona,
      data: result.HomeScreens.map((screen) => ({
        visual_title: screen.visual_title,
        visual_summary: screen.visual_summary,
      })),
    };

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateExecSummary = async (req, res, next) => {
  try {
    const { personaId, data } = req.body;

    if (!personaId) {
      throw new Error("Persona ID is required");
    }

    // Validate the data structure
    if (!Array.isArray(data)) {
      throw new Error("Data must be an array of visual summaries");
    }

    // Update using a transaction to ensure data consistency
    const result = await sequelize.transaction(async (t) => {
      // Update the database
      await Persona.update(
        {
          home_exec_summary: data,
          updated_at: sequelize.literal("GETDATE()"),
        },
        {
          where: { persona_id: personaId },
          returning: true,
          transaction: t,
        }
      );

      // Verify the update
      const updated = await Persona.findOne({
        where: { persona_id: personaId },
        attributes: ["home_exec_summary", "updated_at"],
        transaction: t,
      });

      if (!updated) {
        throw new Error("Failed to verify update");
      }

      return updated;
    });

    res.json({
      success: true,
      message: `Successfully updated executive summary for persona_id ${personaId}`,
    });
  } catch (error) {
    console.error("Error updating executive summary:", error);
    next(error);
  }
};

/**
 * Add KPIs for a specific persona
 * @route POST /dashboard/kpis/:persona_id
 */
exports.addKpis = async (req, res, next) => {
  const { persona_id } = req.params;
  const { KPIs } = req.body;

  if (!persona_id || !KPIs || !Array.isArray(KPIs) || KPIs.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Invalid request. persona_id and KPIs array are required",
    });
  }

  // Start a transaction to ensure all operations succeed or fail together
  const transaction = await sequelize.transaction();

  try {
    const persona = await Persona.findByPk(persona_id, { transaction });

    if (!persona) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: `Persona with ID ${persona_id} not found`,
      });
    }

    const insertedKpiNames = [];
    const results = [];

    // Process each KPI in the array
    for (const kpiData of KPIs) {
      const { kpi, description, sql_expression, action_levers } = kpiData;

      if (!kpi || !description || !sql_expression) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: "Each KPI must have kpi, description, and sql_expression",
        });
      }

      // Check if KPI already exists for this persona
      const existingKpi = await sequelize.models.KPI.findOne({
        where: { kpi, persona_id },
        transaction,
      });

      if (existingKpi) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          error: `KPI '${kpi}' already exists for persona ${persona_id}`,
        });
      }

      // Insert the KPI
      const newKpi = await sequelize.models.KPI.create(
        {
          kpi,
          description,
          sql_expression,
          action_levers,
          persona_id,
        },
        { transaction }
      );

      insertedKpiNames.push(kpi);
      results.push(newKpi);
    }

    // Commit the transaction
    await transaction.commit();

    res.status(201).json({
      success: true,
      message: `Successfully added ${insertedKpiNames.length} KPI(s) for persona ${persona_id}`,
      data: {
        persona_id,
        kpis_added: insertedKpiNames,
        total_count: insertedKpiNames.length,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error adding KPIs:", error);
    next(error);
  }
};

/**
 * Get KPIs for a specific persona
 * @route GET /dashboard/kpis/:persona_id
 */
exports.getPersonaKpis = async (req, res, next) => {
  const { persona_id } = req.params;

  if (!persona_id) {
    return res.status(400).json({
      success: false,
      error: "persona_id is required",
    });
  }

  try {
    const kpis = await sequelize.models.KPI.findAll({
      where: { persona_id },
      attributes: [
        "kpi_id",
        "kpi",
        "description",
        "sql_expression",
        "action_levers",
        "created_at",
        "updated_at",
      ],
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      data: {
        persona_id,
        kpis,
        total_count: kpis.length,
      },
    });
  } catch (error) {
    console.error("Error fetching KPIs:", error);
    next(error);
  }
};

/**
 * Insert a high-level query (HLQ) into the InsightsScreen table
 * @route POST /dashboard/insert_insight_hlq
 */
exports.insertInsightHlq = async (req, res, next) => {
  const { persona_id, user_id, hlq } = req.body;

  if (!persona_id || !user_id || !hlq) {
    return res.status(400).json({
      success: false,
      message: "persona_id, user_id, and hlq are required",
    });
  }

  try {
    const transaction = await sequelize.transaction();

    try {
      // Insert the HLQ into InsightsScreen
      const newInsight = await InsightsScreen.create(
        {
          insight_title: hlq.substring(0, 255), // Truncate if too long
          insight_brief: hlq,
          insight_summary: "",
          sql_query: "",
          data_points: "",
          insight_faqs: "[]",
          insight_anomaly_data_points: "[]",
          insight_visual_link: "",
          status: "N",
          explainability_summary: "",
          confidence_score: 0,
        },
        { transaction }
      );

      await transaction.commit();

      res.json({
        success: true,
        data: {
          insight_id: newInsight.insight_id,
          message: "HLQ inserted successfully",
        },
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error inserting HLQ:", error);
    next(error);
  }
};

/**
 * Associate a persona with an insight
 * @route POST /dashboard/insert_insight_persona
 */
exports.insertInsightPersona = async (req, res, next) => {
  const { persona_id, insight_id } = req.body;

  if (!persona_id || !insight_id) {
    return res.status(400).json({
      success: false,
      message: "persona_id and insight_id are required",
    });
  }

  try {
    // Check if association already exists
    const existingAssociation =
      await sequelize.models.InsightsScreenPersonaRef.findOne({
        where: { persona_id, insight_id },
      });

    if (existingAssociation) {
      return res.json({
        success: true,
        message: "Association already exists",
      });
    }

    // Create the association
    await sequelize.models.InsightsScreenPersonaRef.create({
      persona_id,
      insight_id,
    });

    res.json({
      success: true,
      message: "Insight-persona association created successfully",
    });
  } catch (error) {
    console.error("Error creating insight-persona association:", error);
    next(error);
  }
};

/**
 * Fetch HLQs for a specific persona
 * @route POST /dashboard/fetch_persona_hlq
 */
exports.fetchPersonaHlq = async (req, res, next) => {
  const { persona_id, user_id } = req.body;

  if (!persona_id || !user_id) {
    return res.status(400).json({
      success: false,
      message: "persona_id and user_id are required",
    });
  }

  try {
    const hlqs = await InsightsScreen.findAll({
      include: [
        {
          model: Persona,
          where: { persona_id },
          attributes: [],
          through: { attributes: [] },
        },
      ],
      attributes: [
        "insight_id",
        "insight_title",
        "insight_brief",
        "status",
        "created_at",
      ],
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      data: hlqs,
    });
  } catch (error) {
    console.error("Error fetching persona HLQs:", error);
    next(error);
  }
};

/**
 * Update insight status
 * @route POST /dashboard/update_insight_status
 */
exports.updateInsightStatus = async (req, res, next) => {
  const { insight_id, status } = req.body;

  if (!insight_id || !status) {
    return res.status(400).json({
      success: false,
      message: "insight_id and status are required",
    });
  }

  try {
    const [updatedRowsCount] = await InsightsScreen.update(
      {
        status,
        updated_at: sequelize.literal("GETDATE()"),
      },
      { where: { insight_id } }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Insight not found",
      });
    }

    res.json({
      success: true,
      message: "Insight status updated successfully",
    });
  } catch (error) {
    console.error("Error updating insight status:", error);
    next(error);
  }
};

/**
 * Update business insight data
 * @route POST /dashboard/update_business_insight
 */
exports.updateBusinessInsight = async (req, res, next) => {
  const { insight_id, hlq_block, sql_query } = req.body;

  if (!insight_id || !hlq_block || !sql_query) {
    return res.status(400).json({
      success: false,
      message: "insight_id, hlq_block, and sql_query are required",
    });
  }

  try {
    const [updatedRowsCount] = await InsightsScreen.update(
      {
        insight_brief: hlq_block,
        sql_query,
        updated_at: sequelize.literal("GETDATE()"),
      },
      { where: { insight_id } }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Insight not found",
      });
    }

    res.json({
      success: true,
      message: "Business insight updated successfully",
    });
  } catch (error) {
    console.error("Error updating business insight:", error);
    next(error);
  }
};
