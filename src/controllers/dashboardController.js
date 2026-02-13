// // const db = require("../db/models");
// const { connectSnowflake } = require("../config/database"); // 🔑 use this
// // const { Op } = require("sequelize");
// const {
//   searchInsightsByPersona,
//   searchInsightById,
//   updateInsightAnomalySearch,
//   searchInsightDataById,
// } = require("../utils/awsOpenSearch");
// const { callDashboardAPI } = require("../services/agentService");
// const { endpoints } = require("../config/config");
// const fetch = require("node-fetch").default;
// const axios = require("axios");



// exports.getInsightDetails = async (req, res, next) => {
//   try {
//     const personaId = req.query.personaId;
//     if (!personaId) {
//       return res.status(400).json({
//         success: false,
//         message: "personaId is required",
//       });
//     }

//     const searchDetails = await searchInsightsByPersona(personaId);

//     res.json({
//       success: true,
//       data: searchDetails,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // OPTIMIZED: Removed dataDictionary API call to improve performance
// // exports.homeDashboard = async (req, res, next) => {
// //   try {
// //     // ✅ Ensure Sequelize + models are initialized (runs once, then reuses)
// //     await initSequelize();

// //     // ✅ Get models AFTER initSequelize has run
// //     const HomeScreen = db.HomeScreen;
// //     const Persona = db.Persona;
// //     const sequelize = db.sequelize;

// //     if (!HomeScreen || !Persona || !sequelize) {
// //       console.error("❌ Models or sequelize not initialized:", {
// //         HomeScreen: !!HomeScreen,
// //         Persona: !!Persona,
// //         sequelize: !!sequelize,
// //       });
// //       return res.status(500).json({
// //         success: false,
// //         message: "Models not initialized. Check initSequelize/initModels setup.",
// //       });
// //     }

// //     // ✅ support both: personaId / persona_Id etc.
// //     const personaId = req.query.personaId || req.query.persona_Id;
// //     const userId = req.query.userId || req.query.user_Id;
// //     const clientId = req.query.clientId || req.query.client_Id;

// //     if (!personaId || !userId || !clientId) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Persona ID, User ID, and Client ID are required",
// //       });
// //     }

// //     // PERFORMANCE OPTIMIZATION: Direct database query with minimal includes
// //     const result = await HomeScreen.findAll({
// //       include: [
// //         {
// //           model: Persona,
// //           where: { persona_id: personaId },
// //           attributes: [],             // reduce payload
// //           through: { attributes: [] } // no join table fields
// //         },
// //       ],
// //       where: { status: "Y" },
// //       attributes: [
// //         "visual_id",
// //         "visual_link",
// //         "visual_title",
// //         "visual_summary",
// //         "visual_type",
// //         "current_value",
// //         "is_positive_trend",
// //         "percent_change",
// //         "period_type",
// //         "data_points",
// //         "priority",
// //         "preference",
// //         "python_code",
// //         "sql_query",
// //         "created_at",
// //         "updated_at",
// //       ],
// //       order: [
// //         ["priority", "ASC"],
// //         ["preference", "ASC"],
// //       ],
// //       raw: false,
// //     });

// //     console.log(
// //       `homeDashboard → personaId=${personaId}, userId=${userId}, clientId=${clientId}, rows=${result.length}`
// //     );


// //     // Optional: Call dataDictionary API asynchronously without blocking response // This runs in background and doesn't affect response time 
// //     if (process.env.ENABLE_BACKGROUND_DATA_DICTIONARY === "true") {
// //       setImmediate(async () => {
// //         try {
// //           const payload = {
// //             user_id: [parseInt(userId)],
// //             persona_id: [parseInt(personaId)],
// //             override_flag: false
// //           };

// //           const res = await fetch(endpoints.dataDictionary, {
// //             method: "POST",
// //             headers: { "Content-Type": "application/json" },
// //             body: JSON.stringify(payload),
// //             timeout: 30000,
// //           });
// //           console.log("Data dictionary called:", payload, ": api:", endpoints.dataDictionary,);
// //         } catch (bgError) {
// //           console.warn("Background dataDictionary call failed:", bgError.message);
// //         }
// //       });
// //     }


// //     res.json({
// //       success: true,
// //       data: result,
// //     });
// //   } catch (error) {
// //     console.error("Home Dashboard Error:", error);
// //     next(error);
// //   }
// // };

// // Pure Snowflake
// exports.homeDashboard = async (req, res, next) => {
//   try {

//     const conn = await connectSnowflake();
//     const { personaId, userId, clientId } = req.query;

//     // ----------------------------
//     // 1️⃣ Validate query params
//     // ----------------------------
//     if (!personaId || !userId || !clientId) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required query params (personaId, userId, clientId)"
//       });
//     }

//     // ----------------------------
//     // 2️⃣ Snowflake SQL Query
//     // ----------------------------
//     const query = `
//       SELECT
//         hs.VISUAL_ID,
//         hs.VISUAL_TITLE,
//         hs.VISUAL_SUMMARY,
//         hs.VISUAL_TYPE,
//         hs.SQL_QUERY,
//         hs.PRIORITY,
//         hs.PREFERENCE,
//         hs.STATUS,
//         hs.CLIENT_ID,
//         hs.CREATED_AT,
//         hs.UPDATED_AT
//       FROM SANDBOX_AI_BI.APP_SCHEMA.HOME_SCREEN hs
//       JOIN SANDBOX_AI_BI.APP_SCHEMA.HOME_SCREEN_PERSONA hsp
//         ON hs.VISUAL_ID = hsp.VISUAL_ID
//       WHERE hs.STATUS = 'Y'
//         AND hsp.PERSONA_ID = ?
//       ORDER BY hs.PRIORITY ASC, hs.PREFERENCE ASC
//     `;

//     // ----------------------------
//     // 3️⃣ Execute Snowflake query
//     // ----------------------------
//     conn.execute({
//       sqlText: query,
//       binds: [Number(personaId)],
//       complete: (err, stmt, rows) => {
//         if (err) {
//           console.error("❌ Snowflake query error:", err.message);
//           return res.status(500).json({
//             success: false,
//             message: err.message
//           });
//         }

//         // ----------------------------
//         // 4️⃣ Background Data Dictionary (non-blocking)
//         // ----------------------------
//         if (process.env.ENABLE_BACKGROUND_DATA_DICTIONARY === "true") {
//           setImmediate(async () => {
//             try {
//               const payload = {
//                 user_id: Number(userId),
//                 persona_id: Number(personaId),
//                 client_id: Number(clientId),
//                 override_flag: false
//               };

//               await fetch(endpoints.dataDictionary, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(payload),
//                 timeout: 30000
//               });

//               console.log(
//                 "✅ Data dictionary triggered",
//                 payload
//               );
//             } catch (bgError) {
//               console.warn(
//                 "⚠️ Background dataDictionary failed:",
//                 bgError.message
//               );
//             }
//           });
//         }

//         // ----------------------------
//         // 5️⃣ API Response
//         // ----------------------------
//         return res.json({
//           success: true,
//           data: rows
//         });
//       }
//     });

//   } catch (error) {
//     console.error("❌ HomeDashboard Controller Error:", error);
//     next(error);
//   }
// };

// /**
//  * Generate dashboard PPT and upload to Azure Blob Storage
//  * @route POST /dashboard/dashboards_to_ppt
//  */

// exports.dashboardsToPpt = async (req, res, next) => {
//   try {
//     const { persona_id, visual_ids_lst } = req.body;

//     if (!persona_id || !visual_ids_lst?.length) {
//       return res.status(400).json({
//         success: false,
//         message: "persona_id and visual_ids_lst are required",
//       });
//     }

//     // Forward request to Python service
//     const pythonRes = await axios.post(
//       endpoints.dashboardsToPpt,
//       req.body,
//       { headers: { "Content-Type": "application/json" } }
//     );

//     // Pass response back to frontend
//     res.status(pythonRes.status).json(pythonRes.data);
//   } catch (error) {
//     console.error("Error in dashboardsToPpt:", error.message);
//     next(error);
//   }
// };

// exports.insightsToPpt = async (req, res, next) => {
//   try {
//     const { persona_id, insight_ids_lst } = req.body;

//     if (!persona_id || !insight_ids_lst?.length) {
//       return res.status(400).json({
//         success: false,
//         message: "persona_id and insight_ids_lst are required",
//       });
//     }

//     // Forward request to Python service
//     const pythonRes1 = await axios.post(
//       endpoints.insightsToPpt,
//       req.body,
//       { headers: { "Content-Type": "application/json" }, responseType: "json" }
//     );

//     // Pass response back to frontend
//     res.status(pythonRes1.status).json(pythonRes1.data);
//   } catch (error) {
//     console.error("Error in insightsToPpt:", error.message);
//     next(error);
//   }
// };

// // // OPTIMIZED: Simplified query with better error handling
// // exports.homeSummary = async (req, res, next) => {
// //   try {
// //     const { personaId } = req.query;

// //     if (!personaId) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "personaId is required",
// //       });
// //     }

// //     // PERFORMANCE OPTIMIZATION: Use findByPk for faster lookup
// //     const result = await Persona.findByPk(personaId, {
// //       attributes: ["home_exec_summary"],
// //       raw: true, // Return plain object for better performance
// //     });

// //     res.json({
// //       success: true,
// //       data: result ? [result] : [],
// //     });
// //   } catch (error) {
// //     console.error("Home Summary Error:", error);
// //     next(error);
// //   }
// // };


// exports.homeSummary = async (req, res, next) => {
//   try {
//     const conn=await connectSnowflake();
//     const { personaId } = req.query;

//     // ----------------------------
//     // 1️⃣ Validation
//     // ----------------------------
//     if (!personaId) {
//       return res.status(400).json({
//         success: false,
//         message: "personaId is required",
//       });
//     }

//     // ----------------------------
//     // 2️⃣ Snowflake SQL Query
//     // ----------------------------
//     const query = `
//       SELECT
//         hs.VISUAL_TITLE AS TITLE,
//         hs.VISUAL_SUMMARY AS SUMMARY
//       FROM SANDBOX_AI_BI.APP_SCHEMA.HOME_SCREEN hs
//       JOIN SANDBOX_AI_BI.APP_SCHEMA.HOME_SCREEN_PERSONA hsp
//         ON hsp.VISUAL_ID = hs.VISUAL_ID
//       WHERE hsp.PERSONA_ID = ?
//         AND hs.STATUS = 'Y'
//       ORDER BY hs.PRIORITY, hs.PREFERENCE
//     `;

//     // ----------------------------
//     // 3️⃣ Execute Snowflake Query
//     // ----------------------------
//     conn.execute({
//       sqlText: query,
//       binds: [Number(personaId)],
//       complete: (err, stmt, rows) => {
//         if (err) {
//           console.error("❌ Home Summary Snowflake Error:", err.message);
//           return res.status(500).json({
//             success: false,
//             message: err.message
//           });
//         }

//         // ----------------------------
//         // 4️⃣ Match OLD response format
//         // ----------------------------
//         const formattedData = {
//           home_exec_summary: JSON.stringify(
//             rows.map(r => ({
//               title: r.TITLE,
//               summary: r.SUMMARY
//             }))
//           )
//         };

//         return res.json({
//           success: true,
//           data: [formattedData] // keep exact old structure
//         });
//       }
//     });

//   } catch (error) {
//     console.error("❌ Home Summary Controller Error:", error);
//     next(error);
//   }
// };

// exports.resetVisual = async (req, res, next) => {
//   try {
//     const { personaId, userId } = req.query;

//     if (!personaId || !userId) {
//       return res.status(400).json({
//         success: false,
//         message: "personaId and userId are required",
//       });
//     }

//     // OPTIMIZED: Use transaction for better performance and data consistency
//     const result = await sequelize.transaction(async (t) => {
//       // Reset HomeScreen visuals - Direct SQL for better performance
//       await sequelize.query(
//         `UPDATE USR.HomeScreen 
//          SET status = 'N', updated_at = GETDATE() 
//          WHERE visual_id IN (
//            SELECT hs.visual_id 
//            FROM USR.HomeScreen hs
//            INNER JOIN USR.HomeScreenPersonaRef hspr ON hs.visual_id = hspr.visual_id
//            WHERE hspr.persona_id = :personaId
//          )`,
//         {
//           replacements: { personaId },
//           type: sequelize.QueryTypes.UPDATE,
//           transaction: t,
//         }
//       );

//       // Reset InsightsScreen visuals
//       await sequelize.query(
//         `UPDATE USR.InsightsScreen 
//          SET status = 'N', updated_at = GETDATE() 
//          WHERE insight_id IN (
//            SELECT insight_id 
//            FROM USR.InsightsScreenPersonaRef 
//            WHERE persona_id = :personaId
//          )`,
//         {
//           replacements: { personaId },
//           type: sequelize.QueryTypes.UPDATE,
//           transaction: t,
//         }
//       );

//       return { success: true };
//     });

//     // Call dashboard API asynchronously to not block response
//     setImmediate(async () => {
//       try {
//         await callDashboardAPI({
//           persona_id: parseInt(personaId),
//           user_id: parseInt(userId),
//         });
//       } catch (apiError) {
//         console.warn("Background dashboard API call failed:", apiError.message);
//       }
//     });

//     res.json({
//       success: true,
//       message: "Visuals and insights reset successfully",
//     });
//   } catch (error) {
//     console.error("Reset Visual Error:", error);
//     next(error);
//   }
// };

// exports.getNextUnrefreshedInsight = async (req, res, next) => {
//   try {
//     const { personaId, userId } = req.query;

//     if (!personaId || !userId) {
//       return res.status(400).json({
//         success: false,
//         message: "personaId and userId are required",
//       });
//     }

//     const result = await InsightsScreen.findOne({
//       include: [
//         {
//           model: Persona,
//           where: { persona_id: personaId },
//           attributes: [],
//           through: { attributes: [] },
//         },
//       ],
//       where: { status: "N" },
//       limit: 1,
//       order: [["insight_id", "ASC"]],
//       attributes: [
//         "insight_id",
//         "sql_query",
//         "insight_anomaly_data_points",
//         "insight_title",
//         "insight_brief",
//         "insight_summary",
//         "data_points",
//       ],
//     });

//     res.json({
//       success: true,
//       data: result || {},
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // Update insight endpoint
// exports.updateInsight = async (req, res, next) => {
//   try {
//     const insightData = req.body;

//     if (!insightData.insight_id) {
//       return res.status(400).json({
//         success: false,
//         message: "insight_id is required",
//       });
//     }

//     // Stringify arrays/objects before saving
//     const updatedData = {
//       ...insightData,
//       insight_faqs: Array.isArray(insightData.insight_faqs)
//         ? JSON.stringify(insightData.insight_faqs)
//         : insightData.insight_faqs,
//       insight_anomaly_data_points: Array.isArray(
//         insightData.insight_anomaly_data_points
//       )
//         ? JSON.stringify(insightData.insight_anomaly_data_points)
//         : insightData.insight_anomaly_data_points,
//       status: "Y",
//     };

//     // Remove any potentially problematic date fields
//     delete updatedData.created_at;
//     delete updatedData.updated_at;

//     await InsightsScreen.update(updatedData, {
//       where: { insight_id: insightData.insight_id },
//       hooks: false,
//       silent: true,
//     });

//     // Update timestamp separately using raw query if needed
//     await sequelize.query(
//       `UPDATE USR.InsightsScreen 
//        SET updated_at = GETDATE() 
//        WHERE insight_id = :insightId`,
//       {
//         replacements: { insightId: insightData.insight_id },
//         type: sequelize.QueryTypes.UPDATE,
//       }
//     );

//     res.json({
//       success: true,
//       message: "Insight updated successfully",
//     });
//   } catch (error) {
//     console.error("Update insight error:", {
//       error: error.message,
//       stack: error.stack,
//       data: req.body,
//     });
//     next(error);
//   }
// };

// // Update insight anomaly in Azure Search
// exports.updateInsightAnomaly = async (req, res, next) => {
//   try {
//     const { data, index } = req.body;

//     if (!data || !index) {
//       return res.status(400).json({
//         success: false,
//         message: "data and index are required",
//       });
//     }

//     await updateInsightAnomalySearch(data, index);

//     res.json({
//       success: true,
//       message: "Insight anomaly updated successfully",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// exports.getNextUnrefreshedAnomaly = async (req, res, next) => {
//   try {
//     const { insight_id, index } = req.query;

//     if (!insight_id) {
//       return res.status(400).json({
//         success: false,
//         message: "insight_id is required",
//       });
//     }

//     if (!index) {
//       return res.status(400).json({
//         success: false,
//         message: "index is required",
//       });
//     }

//     const searchResult = await searchInsightById(
//       insight_id,
//       index.replace(/['"]+/g, "")
//     );

//     // Return more detailed response
//     if (!searchResult || searchResult.length === 0) {
//       return res.json({
//         success: true,
//         data: [],
//         message: "No anomaly data found for the given insight_id and index",
//       });
//     }

//     res.json({
//       success: true,
//       data: searchResult,
//     });
//   } catch (error) {
//     console.error("Anomaly search error:", error);

//     const status = error.message.includes("Index name") ? 400 : 500;
//     res.status(status).json({
//       success: false,
//       message: error.message,
//       detail: process.env.NODE_ENV === "development" ? error.stack : undefined,
//     });
//   }
// };

// exports.getNextUnrefreshedVisual = async (req, res, next) => {
//   try {
//     const { personaId, userId } = req.body;

//     const result = await HomeScreen.findAll({
//       include: [
//         {
//           model: Persona,
//           where: { persona_id: personaId },
//           attributes: [],
//           through: { attributes: [] },
//         },
//       ],
//       where: { status: "N" },
//       limit: 1,
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
//       ],
//     });
//     res.json({
//       success: true,
//       data: result[0] || {},
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // exports.updateVisual = async (req, res, next) => {
// //   try {
// //     // 1. Destructure visual_id OUT of the data intended for update
// //     const { visual_id, ...dataToUpdate } = req.body;

// //     await HomeScreen.update(
// //       {
// //         ...dataToUpdate, // Now this does not contain visual_id
// //         status: "Y",
// //       },
// //       {
// //         where: { visual_id: visual_id }, // Use the extracted ID for the WHERE clause
// //       }
// //     );

// //     res.json({
// //       success: true,
// //       message: "Visual updated successfully",
// //     });
// //   } catch (error) {
// //     // This logs the full error to your console so you can see the specific SQL message
// //     console.error("Update Visual Error:", error); 
// //     next(error);
// //   }
// // };

// exports.updateVisual = async (req, res, next) => {
//   try {
//     const { HomeScreen } = db;
//     const { visual_id, ...visualData } = req.body;

//     // --- FIX: Convert boolean to number (1 or 0) ---
//     // The DB column 'is_positive_trend' is SMALLINT, so it needs 0 or 1.
//     // if (typeof visualData.is_positive_trend !== 'undefined') {
//     //     visualData.is_positive_trend = visualData.is_positive_trend ? 1 : 0;
//     // }
//     // -----------------------------------------------

//     await HomeScreen.update(
//       {
//         ...visualData,
//         status: "Y",
//       },
//       {
//         where: { visual_id: visual_id },
//       }
//     );

//     res.json({
//       success: true,
//       message: "Visual updated successfully",
//     });
//   } catch (error) {
//     // Log error to see details like "invalid input syntax"
//     console.error("Update Visual Error:", error);
//     next(error);
//   }
// };

// exports.insightsDashboard = async (req, res, next) => {
//   try {
//     const { personaId } = req.query;

//     if (!personaId) {
//       return res.status(400).json({
//         success: false,
//         message: "personaId is required",
//       });
//     }

//     // Get insights from database
//     const result = await InsightsScreen.findAll({
//       include: [
//         {
//           model: Persona,
//           where: { persona_id: personaId },
//           attributes: [],
//           through: { attributes: [] },
//         },
//       ],
//       where: { status: "Y" },
//       attributes: [
//         "insight_id",
//         "insight_title",
//         "insight_brief",
//         "insight_summary",
//         "insight_faqs",
//         "insight_anomaly_data_points",
//         "data_points",
//         "confidence_score",
//         "explainability_summary",
//         "sql_query",
//         "insight_visual_link",
//         "created_at",
//         "updated_at",
//       ],
//       order: [["confidence_score", "DESC"]],
//       raw: false,
//     });

//     // For each insight, try to get data from Azure Search index first
//     const insightsWithData = await Promise.all(
//       result.map(async (insight) => {
//         const insightObj = insight.toJSON();

//         try {
//           // Try to get data from Azure Search index
//           const searchData = await searchInsightDataById(
//             insightObj.insight_id,
//             process.env.INSIGHTS_DATA_INDEX || "insight-dataframe"
//           );

//           if (searchData && searchData.length > 0) {
//             // Parse the data from Azure Search and embed directly in insight
//             const parsedData = searchData[0].data;
//             insightObj.query_result = parsedData;
//             insightObj.query_execution_time = null;
//             insightObj.query_loading = false;
//             insightObj.query_error = null;

//             console.log(
//               `Found data in Azure Search for insight ${insightObj.insight_id}`
//             );
//           } else {
//             // No data in Azure Search, will need to execute query later
//             insightObj.query_result = [];
//             insightObj.query_execution_time = null;
//             insightObj.query_loading = false;
//             insightObj.query_error = null;
//           }
//         } catch (searchError) {
//           console.error(
//             `Error searching Azure index for insight ${insightObj.insight_id}:`,
//             searchError
//           );
//           // Fallback to empty result
//           insightObj.query_result = [];
//           insightObj.query_execution_time = null;
//           insightObj.query_loading = false;
//           insightObj.query_error = null;
//         }

//         // Determine has_query dynamically based on sql_query presence
//         insightObj.has_query = !!(
//           insightObj.sql_query && insightObj.sql_query.trim().length > 0
//         );

//         return insightObj;
//       })
//     );

//     res.json({
//       success: true,
//       data: insightsWithData,
//     });
//   } catch (error) {
//     console.error("Insights Dashboard Error:", error);
//     next(error);
//   }
// };

// exports.executeInsightQueries = async (req, res, next) => {
//   try {
//     const { personaId, queries } = req.body;

//     if (!personaId || !queries || !Array.isArray(queries)) {
//       return res.status(400).json({
//         success: false,
//         message: "personaId and queries array are required",
//       });
//     }

//     console.log(
//       `Processing ${queries.length} queries for persona ${personaId}`
//     );

//     // Filter out invalid queries
//     const validQueries = queries.filter((q) => {
//       if (!q.insight_id || !q.sql_query) {
//         console.warn(`Skipping invalid query for insight ${q?.insight_id}`);
//         return false;
//       }
//       return true;
//     });

//     // Execute queries sequentially to avoid timeout/resource issues
//     const results = [];
//     for (const query of validQueries) {
//       try {
//         // Parse SQL query if it's a JSON string
//         let parsedQuery = query.sql_query;
//         if (typeof query.sql_query === "string") {
//           try {
//             const queryObj = JSON.parse(query.sql_query);
//             parsedQuery = queryObj.sql_query;
//           } catch (e) {
//             parsedQuery = query.sql_query;
//           }
//         }

//         const startTime = Date.now();

//         // Execute query with timeout
//         const queryResult = await Promise.race([
//           sequelize.query(parsedQuery, {
//             type: sequelize.QueryTypes.SELECT,
//             logging: false,
//           }),
//           new Promise((_, reject) =>
//             setTimeout(
//               () => reject(new Error("Query timeout after 30 seconds")),
//               30000
//             )
//           ),
//         ]);

//         const executionTime = Date.now() - startTime;

//         results.push({
//           insight_id: query.insight_id,
//           success: true,
//           data: queryResult,
//           execution_time: executionTime,
//         });
//       } catch (error) {
//         console.error(`Query failed for insight ${query.insight_id}:`, {
//           error: error.message,
//           query: query.sql_query?.substring(0, 100),
//         });

//         results.push({
//           insight_id: query.insight_id,
//           success: false,
//           error: error.message || "Query execution failed",
//           data: null,
//         });
//       }

//       // Add small delay between queries to prevent overload
//       await new Promise((resolve) => setTimeout(resolve, 100));
//     }

//     // Calculate summary
//     const successCount = results.filter((r) => r.success).length;
//     const failCount = results.length - successCount;

//     console.log(
//       `Execution completed: ${successCount} successful, ${failCount} failed`
//     );

//     return res.json({
//       success: true,
//       data: results,
//       summary: {
//         total: queries.length,
//         successful: successCount,
//         failed: failCount,
//         skipped: queries.length - validQueries.length,
//       },
//     });
//   } catch (error) {
//     console.error("Error in executeInsightQueries:", error);
//     next(error);
//   }
// };

// exports.executeInsightQuery = async (req, res, next) => {
//   try {
//     const { insightId } = req.params;
//     const { sql_query } = req.body;

//     if (!insightId || !sql_query) {
//       return res.status(400).json({
//         success: false,
//         message: "insightId and sql_query are required",
//       });
//     }

//     const startTime = Date.now();

//     // Parse SQL query if it's a JSON string
//     let parsedQuery = sql_query;
//     if (typeof sql_query === "string") {
//       try {
//         const queryObj = JSON.parse(sql_query);
//         parsedQuery = queryObj.sql_query || sql_query;
//       } catch (e) {
//         parsedQuery = sql_query;
//       }
//     }

//     console.log(
//       `Executing query for insight ${insightId}:`,
//       parsedQuery.substring(0, 100) + "..."
//     );

//     // Execute the SQL query
//     const result = await sequelize.query(parsedQuery, {
//       type: sequelize.QueryTypes.SELECT,
//       timeout: 300000,
//       searchPath: "RGM_BASE",
//       queryHint: "OPTION(MAXDOP 4, OPTIMIZE FOR UNKNOWN)",
//     });

//     const executionTime = Date.now() - startTime;
//     console.log(
//       `Query for insight ${insightId} completed in ${executionTime}ms`
//     );

//     // Update the specific insight in the database or cache if needed
//     // This ensures the next time insightsDashboard is called, it has the latest data

//     return res.json({
//       success: true,
//       data: {
//         insight_id: insightId,
//         query_result: result || [],
//         query_execution_time: executionTime,
//         query_loading: false,
//         query_error: null,
//       },
//     });
//   } catch (error) {
//     console.error(
//       `Query execution failed for insight ${req.params.insightId}:`,
//       error
//     );

//     if (
//       error.name === "SequelizeDatabaseError" &&
//       error.parent?.code === "ETIMEOUT"
//     ) {
//       return res.status(408).json({
//         success: false,
//         error:
//           "Query exceeded time limit. Please try with a simpler query or contact support.",
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       error: "Query execution failed",
//       details:
//         process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };

// exports.getAllVisualSummaries = async (req, res, next) => {
//   try {
//     const { personaId } = req.query;

//     if (!personaId) {
//       throw new Error("Persona ID is required");
//     }

//     const result = await Persona.findOne({
//       where: { persona_id: personaId },
//       attributes: ["persona"],
//       include: [
//         {
//           model: HomeScreen,
//           through: { attributes: [] },
//           attributes: ["visual_title", "visual_summary"],
//         },
//       ],
//     });

//     if (!result) {
//       return res.json({
//         success: false,
//         message: "No data found for given persona",
//       });
//     }

//     const response = {
//       persona: result.persona,
//       data: result.HomeScreens.map((screen) => ({
//         visual_title: screen.visual_title,
//         visual_summary: screen.visual_summary,
//       })),
//     };

//     res.json({
//       success: true,
//       data: response,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// exports.updateExecSummary = async (req, res, next) => {
//   try {
//     const { personaId, data } = req.body;

//     if (!personaId) {
//       throw new Error("Persona ID is required");
//     }

//     // Validate the data structure
//     if (!Array.isArray(data)) {
//       throw new Error("Data must be an array of visual summaries");
//     }

//     // Update using a transaction to ensure data consistency
//     const result = await sequelize.transaction(async (t) => {
//       // Update the database
//       await Persona.update(
//         {
//           home_exec_summary: data,
//           updated_at: sequelize.literal("NOW()"),
//         },
//         {
//           where: { persona_id: personaId },
//           returning: true,
//           transaction: t,
//         }
//       );

//       // Verify the update
//       const updated = await Persona.findOne({
//         where: { persona_id: personaId },
//         attributes: ["home_exec_summary", "updated_at"],
//         transaction: t,
//       });

//       if (!updated) {
//         throw new Error("Failed to verify update");
//       }

//       return updated;
//     });

//     res.json({
//       success: true,
//       message: `Successfully updated executive summary for persona_id ${personaId}`,
//     });
//   } catch (error) {
//     console.error("Error updating executive summary:", error);
//     next(error);
//   }
// };

// /**
//  * Add KPIs for a specific persona
//  * @route POST /dashboard/kpis/:persona_id
//  */
// exports.addKpis = async (req, res, next) => {
//   const { persona_id } = req.params;
//   const { KPIs } = req.body;

//   if (!persona_id || !KPIs || !Array.isArray(KPIs) || KPIs.length === 0) {
//     return res.status(400).json({
//       success: false,
//       error: "Invalid request. persona_id and KPIs array are required",
//     });
//   }

//   // Start a transaction to ensure all operations succeed or fail together
//   const transaction = await sequelize.transaction();

//   try {
//     const persona = await Persona.findByPk(persona_id, { transaction });

//     if (!persona) {
//       await transaction.rollback();
//       return res.status(404).json({
//         success: false,
//         error: `Persona with ID ${persona_id} not found`,
//       });
//     }

//     const insertedKpiNames = [];
//     const results = [];

//     // Process each KPI in the array
//     for (const kpiData of KPIs) {
//       const { kpi, description, sql_expression, action_levers } = kpiData;

//       if (!kpi || !description || !sql_expression) {
//         await transaction.rollback();
//         return res.status(400).json({
//           success: false,
//           error: "Each KPI must have kpi, description, and sql_expression",
//         });
//       }

//       // Check if KPI already exists for this persona
//       const existingKpi = await sequelize.models.KPI.findOne({
//         where: { kpi, persona_id },
//         transaction,
//       });

//       if (existingKpi) {
//         await transaction.rollback();
//         return res.status(409).json({
//           success: false,
//           error: `KPI '${kpi}' already exists for persona ${persona_id}`,
//         });
//       }

//       // Insert the KPI
//       const newKpi = await sequelize.models.KPI.create(
//         {
//           kpi,
//           description,
//           sql_expression,
//           action_levers,
//           persona_id,
//         },
//         { transaction }
//       );

//       insertedKpiNames.push(kpi);
//       results.push(newKpi);
//     }

//     // Commit the transaction
//     await transaction.commit();

//     res.status(201).json({
//       success: true,
//       message: `Successfully added ${insertedKpiNames.length} KPI(s) for persona ${persona_id}`,
//       data: {
//         persona_id,
//         kpis_added: insertedKpiNames,
//         total_count: insertedKpiNames.length,
//       },
//     });
//   } catch (error) {
//     await transaction.rollback();
//     console.error("Error adding KPIs:", error);
//     next(error);
//   }
// };

// /**
//  * Get KPIs for a specific persona
//  * @route GET /dashboard/kpis/:persona_id
//  */
// exports.getPersonaKpis = async (req, res, next) => {
//   const { persona_id } = req.params;

//   if (!persona_id) {
//     return res.status(400).json({
//       success: false,
//       error: "persona_id is required",
//     });
//   }

//   try {
//     const kpis = await sequelize.models.KPI.findAll({
//       where: { persona_id },
//       attributes: [
//         "kpi_id",
//         "kpi",
//         "description",
//         "sql_expression",
//         "action_levers",
//         "created_at",
//         "updated_at",
//       ],
//       order: [["created_at", "DESC"]],
//     });

//     res.json({
//       success: true,
//       data: {
//         persona_id,
//         kpis,
//         total_count: kpis.length,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching KPIs:", error);
//     next(error);
//   }
// };

// /**
//  * Insert a high-level query (HLQ) into the InsightsScreen table
//  * @route POST /dashboard/insert_insight_hlq
//  */
// exports.insertInsightHlq = async (req, res, next) => {
//   const { persona_id, user_id, hlq } = req.body;

//   if (!persona_id || !user_id || !hlq) {
//     return res.status(400).json({
//       success: false,
//       message: "persona_id, user_id, and hlq are required",
//     });
//   }

//   try {
//     const transaction = await sequelize.transaction();

//     try {
//       // Insert the HLQ into InsightsScreen
//       const newInsight = await InsightsScreen.create(
//         {
//           insight_title: hlq.substring(0, 255), // Truncate if too long
//           insight_brief: hlq,
//           insight_summary: "",
//           sql_query: "",
//           data_points: "",
//           insight_faqs: "[]",
//           insight_anomaly_data_points: "[]",
//           insight_visual_link: "",
//           status: "N",
//           explainability_summary: "",
//           confidence_score: 0,
//         },
//         { transaction }
//       );

//       await transaction.commit();

//       res.json({
//         success: true,
//         data: {
//           insight_id: newInsight.insight_id,
//           message: "HLQ inserted successfully",
//         },
//       });
//     } catch (error) {
//       await transaction.rollback();
//       throw error;
//     }
//   } catch (error) {
//     console.error("Error inserting HLQ:", error);
//     next(error);
//   }
// };

// /**
//  * Associate a persona with an insight
//  * @route POST /dashboard/insert_insight_persona
//  */
// exports.insertInsightPersona = async (req, res, next) => {
//   const { persona_id, insight_id } = req.body;

//   if (!persona_id || !insight_id) {
//     return res.status(400).json({
//       success: false,
//       message: "persona_id and insight_id are required",
//     });
//   }

//   try {
//     // Check if association already exists
//     const existingAssociation =
//       await sequelize.models.InsightsScreenPersonaRef.findOne({
//         where: { persona_id, insight_id },
//       });

//     if (existingAssociation) {
//       return res.json({
//         success: true,
//         message: "Association already exists",
//       });
//     }

//     // Create the association
//     await sequelize.models.InsightsScreenPersonaRef.create({
//       persona_id,
//       insight_id,
//     });

//     res.json({
//       success: true,
//       message: "Insight-persona association created successfully",
//     });
//   } catch (error) {
//     console.error("Error creating insight-persona association:", error);
//     next(error);
//   }
// };

// /**
//  * Fetch HLQs for a specific persona
//  * @route POST /dashboard/fetch_persona_hlq
//  */
// exports.fetchPersonaHlq = async (req, res, next) => {
//   const { persona_id, user_id } = req.body;

//   if (!persona_id || !user_id) {
//     return res.status(400).json({
//       success: false,
//       message: "persona_id and user_id are required",
//     });
//   }

//   try {
//     const hlqs = await InsightsScreen.findAll({
//       include: [
//         {
//           model: Persona,
//           where: { persona_id },
//           attributes: [],
//           through: { attributes: [] },
//         },
//       ],
//       attributes: [
//         "insight_id",
//         "insight_title",
//         "insight_brief",
//         "status",
//         "created_at",
//       ],
//       order: [["created_at", "DESC"]],
//     });

//     res.json({
//       success: true,
//       data: hlqs,
//     });
//   } catch (error) {
//     console.error("Error fetching persona HLQs:", error);
//     next(error);
//   }
// };

// /**
//  * Update insight status
//  * @route POST /dashboard/update_insight_status
//  */
// exports.updateInsightStatus = async (req, res, next) => {
//   const { insight_id, status } = req.body;

//   if (!insight_id || !status) {
//     return res.status(400).json({
//       success: false,
//       message: "insight_id and status are required",
//     });
//   }

//   try {
//     const [updatedRowsCount] = await InsightsScreen.update(
//       {
//         status,
//         updated_at: sequelize.literal("NOW()"),
//       },
//       { where: { insight_id } }
//     );

//     if (updatedRowsCount === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Insight not found",
//       });
//     }

//     res.json({
//       success: true,
//       message: "Insight status updated successfully",
//     });
//   } catch (error) {
//     console.error("Error updating insight status:", error);
//     next(error);
//   }
// };

// /**
//  * Update business insight data
//  * @route POST /dashboard/update_business_insight
//  */
// exports.updateBusinessInsight = async (req, res, next) => {
//   const { insight_id, hlq_block, sql_query } = req.body;

//   if (!insight_id || !hlq_block || !sql_query) {
//     return res.status(400).json({
//       success: false,
//       message: "insight_id, hlq_block, and sql_query are required",
//     });
//   }

//   try {
//     const [updatedRowsCount] = await InsightsScreen.update(
//       {
//         insight_brief: hlq_block,
//         sql_query,
//         updated_at: sequelize.literal("NOW()"),
//       },
//       { where: { insight_id } }
//     );

//     if (updatedRowsCount === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Insight not found",
//       });
//     }

//     res.json({
//       success: true,
//       message: "Business insight updated successfully",
//     });
//   } catch (error) {
//     console.error("Error updating business insight:", error);
//     next(error);
//   }
// };

const { connectSnowflake } = require("../config/database");
const {
  searchInsightsByPersona,
  searchInsightById,
  updateInsightAnomalySearch,
  searchInsightDataById,
} = require("../utils/awsOpenSearch");
const { callDashboardAPI } = require("../services/agentService");
const { endpoints } = require("../config/config");
const axios = require("axios");

// ==========================================
// HELPER FUNCTIONS (SonarQube: Reduces Cognitive Complexity)
// ==========================================

/**
 * Wraps Snowflake execution in a Promise for async/await usage.
 * @param {Object} conn - Active Snowflake connection
 * @param {String} sqlText - The SQL query
 * @param {Array} binds - Array of bind parameters
 * @returns {Promise<Array>} - Query results
 */
const executeSnowflake = (conn, sqlText, binds = []) => {
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText,
      binds,
      complete: (err, stmt, rows) => {
        if (err) {
          console.error("❌ Snowflake Query Error:", err.message);
          return reject(err);
        }
        resolve(rows);
      },
    });
  });
};

/**
 * Maps Snowflake UPPERCASE column names to lowercase keys.
 * @param {Array} rows - Array of row objects from Snowflake
 * @returns {Array} - Array of objects with lowercase keys
 */
const mapToLowerCase = (rows) => {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.map((row) => {
    const newRow = {};
    for (const key in row) {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        newRow[key.toLowerCase()] = row[key];
      }
    }
    return newRow;
  });
};

// ==========================================
// CONTROLLERS
// ==========================================

exports.getInsightDetails = async (req, res, next) => {
  try {
    const { personaId } = req.query;
    if (!personaId) {
      return res.status(400).json({ success: false, message: "personaId is required" });
    }

    const searchDetails = await searchInsightsByPersona(personaId);
    res.json({ success: true, data: searchDetails });
  } catch (error) {
    next(error);
  }
};

exports.homeDashboard = async (req, res, next) => {
  try {
    const conn = await connectSnowflake();
    const { personaId, userId, clientId } = req.query;

    if (!personaId || !userId || !clientId) {
      return res.status(400).json({
        success: false,
        message: "Missing required query params (personaId, userId, clientId)",
      });
    }

    const query = `
      SELECT
        hs.VISUAL_ID, hs.VISUAL_TITLE, hs.VISUAL_SUMMARY, hs.VISUAL_TYPE,
        hs.SQL_QUERY, hs.PRIORITY, hs.PREFERENCE, hs.STATUS,
        CAST(hs.CLIENT_ID AS VARCHAR) as CLIENT_ID,
        hs.CREATED_AT, hs.UPDATED_AT
      FROM SANDBOX_AI_BI.APP_SCHEMA.HOME_SCREEN hs
      JOIN SANDBOX_AI_BI.APP_SCHEMA.HOME_SCREEN_PERSONA_REF hsp
        ON hs.VISUAL_ID = hsp.VISUAL_ID
      WHERE hs.STATUS = 'Y' AND hsp.PERSONA_ID = ?
      ORDER BY hs.PRIORITY ASC, hs.PREFERENCE ASC
    `;

    const rows = await executeSnowflake(conn, query, [Number(personaId)]);

    // Non-blocking Data Dictionary Trigger
    if (process.env.ENABLE_BACKGROUND_DATA_DICTIONARY === "true") {
      setImmediate(async () => {
        try {
          await axios.post(endpoints.dataDictionary, {
            user_id: Number(userId),
            persona_id: Number(personaId),
            client_id: Number(clientId),
            override_flag: false,
          });
        } catch (bgError) {
          console.warn("⚠️ Background dataDictionary failed:", bgError.message);
        }
      });
    }

    return res.json({ success: true, data: mapToLowerCase(rows) });
  } catch (error) {
    next(error);
  }
};

exports.dashboardsToPpt = async (req, res, next) => {
  try {
    const { persona_id, visual_ids_lst } = req.body;

    if (!persona_id || !visual_ids_lst?.length) {
      return res.status(400).json({ success: false, message: "persona_id and visual_ids_lst are required" });
    }

    const pythonRes = await axios.post(endpoints.dashboardsToPpt, req.body, {
      headers: { "Content-Type": "application/json" },
    });
    res.status(pythonRes.status).json(pythonRes.data);
  } catch (error) {
    next(error);
  }
};

exports.insightsToPpt = async (req, res, next) => {
  try {
    const { persona_id, insight_ids_lst } = req.body;

    if (!persona_id || !insight_ids_lst?.length) {
      return res.status(400).json({ success: false, message: "persona_id and insight_ids_lst are required" });
    }

    const pythonRes = await axios.post(endpoints.insightsToPpt, req.body, {
      headers: { "Content-Type": "application/json" },
    });
    res.status(pythonRes.status).json(pythonRes.data);
  } catch (error) {
    next(error);
  }
};

exports.homeSummary = async (req, res, next) => {
  try {
    const conn = await connectSnowflake();
    const { personaId } = req.query;

    if (!personaId) return res.status(400).json({ success: false, message: "personaId is required" });

    const query = `
      SELECT hs.VISUAL_TITLE AS TITLE, hs.VISUAL_SUMMARY AS SUMMARY
      FROM SANDBOX_AI_BI.APP_SCHEMA.HOME_SCREEN hs
      JOIN SANDBOX_AI_BI.APP_SCHEMA.HOME_SCREEN_PERSONA_REF hsp ON hsp.VISUAL_ID = hs.VISUAL_ID
      WHERE hsp.PERSONA_ID = ? AND hs.STATUS = 'Y'
      ORDER BY hs.PRIORITY, hs.PREFERENCE
    `;

    const rows = await executeSnowflake(conn, query, [Number(personaId)]);

    const formattedData = {
      home_exec_summary: JSON.stringify(
        rows.map((r) => ({ title: r.TITLE, summary: r.SUMMARY }))
      ),
    };

    return res.json({ success: true, data: [formattedData] });
  } catch (error) {
    next(error);
  }
};

exports.resetVisual = async (req, res, next) => {
  try {
    const conn = await connectSnowflake();
    const { personaId, userId } = req.query;

    if (!personaId || !userId) {
      return res.status(400).json({ success: false, message: "personaId and userId are required" });
    }

    // Reset Home Screen
    const homeQuery = `
      UPDATE SANDBOX_AI_BI.APP_SCHEMA.HOME_SCREEN
      SET STATUS = 'N', UPDATED_AT = CURRENT_TIMESTAMP()
      WHERE VISUAL_ID IN (
        SELECT VISUAL_ID FROM SANDBOX_AI_BI.APP_SCHEMA.HOME_SCREEN_PERSONA_REF WHERE PERSONA_ID = ?
      )
    `;

    // Reset Insights Screen
    const insightsQuery = `
      UPDATE SANDBOX_AI_BI.APP_SCHEMA.INSIGHTS_SCREEN
      SET STATUS = 'N', UPDATED_AT = CURRENT_TIMESTAMP()
      WHERE INSIGHT_ID IN (
        SELECT INSIGHT_ID FROM SANDBOX_AI_BI.APP_SCHEMA.INSIGHTS_SCREEN_PERSONA_REF WHERE PERSONA_ID = ?
      )
    `;

    // Execute in parallel safely
    await Promise.all([
      executeSnowflake(conn, homeQuery, [Number(personaId)]),
      executeSnowflake(conn, insightsQuery, [Number(personaId)])
    ]);

    setImmediate(async () => {
      try {
        await callDashboardAPI({ persona_id: parseInt(personaId), user_id: parseInt(userId) });
      } catch (e) {
        console.warn("Background API call failed:", e.message);
      }
    });

    res.json({ success: true, message: "Visuals and insights reset successfully" });
  } catch (error) {
    next(error);
  }
};

exports.getNextUnrefreshedInsight = async (req, res, next) => {
  try {
    const conn = await connectSnowflake();
    const { personaId, userId } = req.query;

    if (!personaId || !userId) {
      return res.status(400).json({ success: false, message: "personaId and userId are required" });
    }

    const query = `
      SELECT i.INSIGHT_ID, i.SQL_QUERY, i.INSIGHT_ANOMALY_DATA_POINTS, i.INSIGHT_TITLE,
             i.INSIGHT_BRIEF, i.INSIGHT_SUMMARY, i.DATA_POINTS
      FROM SANDBOX_AI_BI.APP_SCHEMA.INSIGHTS_SCREEN i
      JOIN SANDBOX_AI_BI.APP_SCHEMA.INSIGHTS_SCREEN_PERSONA_REF r ON i.INSIGHT_ID = r.INSIGHT_ID
      WHERE r.PERSONA_ID = ? AND i.STATUS = 'N'
      ORDER BY i.INSIGHT_ID ASC LIMIT 1
    `;

    const rows = await executeSnowflake(conn, query, [Number(personaId)]);
    const data = mapToLowerCase(rows);

    res.json({ success: true, data: data[0] || {} });
  } catch (error) {
    next(error);
  }
};

exports.updateInsight = async (req, res, next) => {
  try {
    const conn = await connectSnowflake();
    const insightData = req.body;

    if (!insightData.insight_id) {
      return res.status(400).json({ success: false, message: "insight_id is required" });
    }

    // Prepare JSON fields safely
    const faqs = typeof insightData.insight_faqs === 'object' ? JSON.stringify(insightData.insight_faqs) : insightData.insight_faqs;
    const anomaly = typeof insightData.insight_anomaly_data_points === 'object' ? JSON.stringify(insightData.insight_anomaly_data_points) : insightData.insight_anomaly_data_points;
    const points = typeof insightData.data_points === 'object' ? JSON.stringify(insightData.data_points) : insightData.data_points;

    // Build dynamic update query to avoid overwriting fields with nulls if not provided
    // However, based on typical controller usage, specific fields are usually targeted.
    // For safety with Snowflake, we explicitly list the fields we expect to update.
    const query = `
      UPDATE SANDBOX_AI_BI.APP_SCHEMA.INSIGHTS_SCREEN
      SET 
        INSIGHT_TITLE = ?,
        INSIGHT_SUMMARY = ?,
        INSIGHT_FAQS = ?,
        INSIGHT_ANOMALY_DATA_POINTS = ?,
        DATA_POINTS = ?,
        EXPLAINABILITY_SUMMARY = ?,
        CONFIDENCE_SCORE = ?,
        STATUS = 'Y',
        UPDATED_AT = CURRENT_TIMESTAMP()
      WHERE INSIGHT_ID = ?
    `;

    // Ensure we handle undefined values gracefully
    const binds = [
      insightData.insight_title || null,
      insightData.insight_summary || null,
      faqs || null,
      anomaly || null,
      points || null,
      insightData.explainability_summary || null,
      insightData.confidence_score || 0,
      insightData.insight_id
    ];

    await executeSnowflake(conn, query, binds);
    res.json({ success: true, message: "Insight updated successfully" });
  } catch (error) {
    next(error);
  }
};

exports.updateInsightAnomaly = async (req, res, next) => {
  try {
    const { data, index } = req.body;
    if (!data || !index) return res.status(400).json({ success: false, message: "data and index are required" });

    await updateInsightAnomalySearch(data, index);
    res.json({ success: true, message: "Insight anomaly updated successfully" });
  } catch (error) {
    next(error);
  }
};

exports.getNextUnrefreshedAnomaly = async (req, res, next) => {
  try {
    const { insight_id, index } = req.query;
    if (!insight_id || !index) return res.status(400).json({ success: false, message: "insight_id and index required" });

    const searchResult = await searchInsightById(insight_id, index.replace(/['"]+/g, ""));

    if (!searchResult || searchResult.length === 0) {
      return res.json({ success: true, data: [], message: "No anomaly data found" });
    }
    res.json({ success: true, data: searchResult });
  } catch (error) {
    const status = error.message.includes("Index name") ? 400 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// exports.getNextUnrefreshedVisual = async (req, res, next) => {
//   try {
//     const conn = await connectSnowflake();
//     const { personaId } = req.body; // Logic based on original code reading from body

//     if (!personaId) return res.status(400).json({ success: false, message: "personaId is required" });

//     const query = `
//       SELECT hs.*
//       FROM SANDBOX_AI_BI.APP_SCHEMA.HOME_SCREEN hs
//       JOIN SANDBOX_AI_BI.APP_SCHEMA.HOME_SCREEN_PERSONA_REF r ON hs.VISUAL_ID = r.VISUAL_ID
//       WHERE r.PERSONA_ID = ? AND hs.STATUS = 'N'
//       LIMIT 1
//     `;

//     const rows = await executeSnowflake(conn, query, [Number(personaId)]);
//     const data = mapToLowerCase(rows);
//     res.json({ success: true, data: data[0] || {} });
//   } catch (error) {
//     next(error);
//   }
// };

exports.getNextUnrefreshedVisual = async (req, res, next) => {
  try {
    const conn = await connectSnowflake();
    const { personaId } = req.body;

    if (!personaId) return res.status(400).json({ success: false, message: "personaId is required" });

    // FIX: We explicitly cast CLIENT_ID (and VISUAL_ID if it's large) to STRING (VARCHAR)
    // using "REPLACE" or explicit selection ensures we don't get the number version.
    const query = `
      SELECT 
        hs.VISUAL_ID,
        hs.VISUAL_LINK,
        hs.VISUAL_TITLE,
        hs.VISUAL_SUMMARY,
        hs.VISUAL_TYPE,
        hs.CURRENT_VALUE,
        hs.IS_POSITIVE_TREND,
        hs.PERCENT_CHANGE,
        hs.PERIOD_TYPE,
        hs.DATA_POINTS,
        hs.PRIORITY,
        hs.PREFERENCE,
        hs.PYTHON_CODE,
        hs.SQL_QUERY,
        hs.STATUS,
        CAST(hs.CLIENT_ID AS VARCHAR) as CLIENT_ID 
      FROM SANDBOX_AI_BI.APP_SCHEMA.HOME_SCREEN hs
      JOIN SANDBOX_AI_BI.APP_SCHEMA.HOME_SCREEN_PERSONA_REF r ON hs.VISUAL_ID = r.VISUAL_ID
      WHERE r.PERSONA_ID = ? AND hs.STATUS = 'N'
      LIMIT 1
    `;

    const rows = await executeSnowflake(conn, query, [Number(personaId)]);
    console.log("###Rows:", rows);

    const data = mapToLowerCase(rows);
    console.log("###data:", data);

    res.json({ success: true, data: data[0] || {} });
  } catch (error) {
    next(error);
  }
};

exports.updateVisual = async (req, res, next) => {
  try {

    // =========================================================
    // START: REPLACEMENT FOR HomeScreen.update
    // =========================================================

    const conn = await connectSnowflake();

    // 1. Separate the ID (for WHERE) from the data (for SET)
    const { visual_id, ...restofData } = visualData;
    if (!visual_id) {
      return res.status(400).json(
        {
          success: false,
          message: "Visual_id is required"
        }
      );
    }

    // 2. Merge status='Y' (Same as your Sequelize code)
    const dataToUpdate = { ...restofData, status: "Y" };

    const fields = [];
    const bind = [];

    // 3. Dynamic Loop: Convert JS keys to Snowflake Columns
    Object.keys(dataToUpdate).forEach((key) => {
      // Skip keys we handle manually or don't want to update
      if (key === 'updated_at' || key === 'Visual_id') {
        return;
      }

      // Convert "visualTitle" -> "VISUAL_TITLE"
      const colName = key.replace(/([A-Z])/g, "_$1").toUpperCase();

      let value = dataToUpdate[key];

      // Snowflake needs Objects/Arrays stringified for VARIANT columns
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }

      fields.push(`${colName} = ?`);
      bind.push(value);
    });

    // 4. Manually add UPDATED_AT (Sequelize usually does this automatically)
    fields.push("UPDATED_AT = CURRENT_TIMESTAMP()");

    // 5. Add ID for the WHERE clause
    bind.push(visual_id);

    // 6. Execute Update
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No Data Provied to Update"
      });
    }
    const query = `UPDATE SANDBOX_AI_BI.APP_SCHEMA.HOME_SCREEN SET ${fields.join(", ")} WHERE VISUAL_ID = ?`;

    console.log("*** Execution Query ****:", query);
    console.log("### Execution bind ###:", bind);
    console.log("*** Execution fields ****:", fields);

    await executeSnowflake(conn, query, bind);

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
    const conn = await connectSnowflake();
    const { personaId } = req.query;

    if (!personaId) return res.status(400).json({ success: false, message: "personaId is required" });

    const query = `
      SELECT i.INSIGHT_ID, i.INSIGHT_TITLE, i.INSIGHT_BRIEF, i.INSIGHT_SUMMARY, 
             i.INSIGHT_FAQS, i.INSIGHT_ANOMALY_DATA_POINTS, i.DATA_POINTS, 
             i.CONFIDENCE_SCORE, i.EXPLAINABILITY_SUMMARY, i.SQL_QUERY, 
             i.INSIGHT_VISUAL_LINK, i.CREATED_AT, i.UPDATED_AT
      FROM SANDBOX_AI_BI.APP_SCHEMA.INSIGHTS_SCREEN i
      JOIN SANDBOX_AI_BI.APP_SCHEMA.INSIGHTS_SCREEN_PERSONA_REF r ON i.INSIGHT_ID = r.INSIGHT_ID
      WHERE r.PERSONA_ID = ? AND i.STATUS = 'Y'
      ORDER BY i.CONFIDENCE_SCORE DESC
    `;

    const rawRows = await executeSnowflake(conn, query, [Number(personaId)]);
    const insights = mapToLowerCase(rawRows);

    // Hydrate with Azure Search Data
    const insightsWithData = await Promise.all(
      insights.map(async (insightObj) => {
        try {
          const indexName = process.env.INSIGHTS_DATA_INDEX || "insight-dataframe";
          const searchData = await searchInsightDataById(insightObj.insight_id, indexName);

          insightObj.query_result = (searchData && searchData.length > 0) ? searchData[0].data : [];
          insightObj.query_loading = false;
        } catch (searchError) {
          console.warn(`Azure Search missing for ${insightObj.insight_id}`);
          insightObj.query_result = [];
        }
        insightObj.has_query = !!(insightObj.sql_query && insightObj.sql_query.trim().length > 0);
        return insightObj;
      })
    );

    res.json({ success: true, data: insightsWithData });
  } catch (error) {
    next(error);
  }
};

exports.executeInsightQueries = async (req, res, next) => {
  try {
    const conn = await connectSnowflake();
    const { personaId, queries } = req.body;

    if (!personaId || !Array.isArray(queries)) {
      return res.status(400).json({ success: false, message: "personaId and queries array required" });
    }

    const results = [];
    const validQueries = queries.filter(q => q.insight_id && q.sql_query);

    // Sequential execution to manage connection load
    for (const q of validQueries) {
      let sql = q.sql_query;
      // Handle potentially JSON-wrapped SQL strings from GenAI
      if (typeof sql === "string" && sql.trim().startsWith("{")) {
        try { sql = JSON.parse(sql).sql_query || sql; } catch (e) { /* ignore */ }
      }

      const start = Date.now();
      try {
        const data = await executeSnowflake(conn, sql);
        results.push({
          insight_id: q.insight_id,
          success: true,
          data: mapToLowerCase(data),
          execution_time: Date.now() - start
        });
      } catch (err) {
        results.push({
          insight_id: q.insight_id,
          success: false,
          error: err.message,
          data: null
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    res.json({
      success: true,
      data: results,
      summary: { total: queries.length, successful: successCount, failed: results.length - successCount }
    });
  } catch (error) {
    next(error);
  }
};

exports.executeInsightQuery = async (req, res, next) => {
  try {
    const conn = await connectSnowflake();
    const { insightId } = req.params;
    let { sql_query } = req.body;

    if (!insightId || !sql_query) return res.status(400).json({ success: false, message: "Missing params" });

    if (typeof sql_query === "string" && sql_query.trim().startsWith("{")) {
      try { sql_query = JSON.parse(sql_query).sql_query || sql_query; } catch (e) { /* ignore */ }
    }

    const start = Date.now();
    const data = await executeSnowflake(conn, sql_query);

    res.json({
      success: true,
      data: {
        insight_id: insightId,
        query_result: mapToLowerCase(data),
        query_execution_time: Date.now() - start,
        query_loading: false,
        query_error: null
      }
    });
  } catch (error) {
    console.error("Single Query Error:", error);
    res.status(500).json({ success: false, error: "Query execution failed", details: error.message });
  }
};

exports.getAllVisualSummaries = async (req, res, next) => {
  try {
    const conn = await connectSnowflake();
    const { personaId } = req.query;

    if (!personaId) return res.status(400).json({ success: false, message: "personaId required" });

    const query = `
        SELECT p.PERSONA, hs.VISUAL_TITLE, hs.VISUAL_SUMMARY
        FROM SANDBOX_AI_BI.APP_SCHEMA.PERSONA p
        JOIN SANDBOX_AI_BI.APP_SCHEMA.HOME_SCREEN_PERSONA_REF r ON p.PERSONA_ID = r.PERSONA_ID
        JOIN SANDBOX_AI_BI.APP_SCHEMA.HOME_SCREEN hs ON r.VISUAL_ID = hs.VISUAL_ID
        WHERE p.PERSONA_ID = ?
    `;

    const rows = await executeSnowflake(conn, query, [Number(personaId)]);

    if (rows.length === 0) return res.json({ success: false, message: "No data found" });

    res.json({
      success: true,
      data: {
        persona: rows[0].PERSONA,
        data: rows.map(r => ({ visual_title: r.VISUAL_TITLE, visual_summary: r.VISUAL_SUMMARY }))
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateExecSummary = async (req, res, next) => {
  try {
    const conn = await connectSnowflake();
    const { personaId, data } = req.body;

    if (!personaId || !Array.isArray(data)) return res.status(400).json({ success: false, message: "Invalid input" });

    const query = `UPDATE SANDBOX_AI_BI.APP_SCHEMA.PERSONA SET HOME_EXEC_SUMMARY = ?, UPDATED_AT = CURRENT_TIMESTAMP() WHERE PERSONA_ID = ?`;

    await executeSnowflake(conn, query, [JSON.stringify(data), Number(personaId)]);

    res.json({ success: true, message: `Successfully updated executive summary` });
  } catch (error) {
    next(error);
  }
};

exports.addKpis = async (req, res, next) => {
  try {
    const conn = await connectSnowflake();
    const { persona_id } = req.params;
    const { KPIs } = req.body;

    if (!persona_id || !Array.isArray(KPIs)) return res.status(400).json({ success: false, message: "Invalid input" });

    // Using Promise.all for faster bulk insertion
    const insertPromises = KPIs.map(kpi => {
      const query = `
            INSERT INTO SANDBOX_AI_BI.APP_SCHEMA.KPIS 
            (KPI, DESCRIPTION, SQL_EXPRESSION, ACTION_LEVERS, PERSONA_ID, CREATED_AT)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP())
        `;
      return executeSnowflake(conn, query, [
        kpi.kpi, kpi.description, kpi.sql_expression, kpi.action_levers, persona_id
      ]);
    });

    await Promise.all(insertPromises);

    res.status(201).json({
      success: true,
      message: `Successfully added ${KPIs.length} KPI(s)`,
      data: { persona_id, kpis_added: KPIs.length }
    });
  } catch (error) {
    next(error);
  }
};

exports.getPersonaKpis = async (req, res, next) => {
  try {
    const conn = await connectSnowflake();
    const { persona_id } = req.params;

    const query = `SELECT * FROM SANDBOX_AI_BI.APP_SCHEMA.KPIS WHERE PERSONA_ID = ? ORDER BY CREATED_AT DESC`;
    const rows = await executeSnowflake(conn, query, [persona_id]);

    res.json({
      success: true,
      data: { persona_id, kpis: mapToLowerCase(rows), total_count: rows.length }
    });
  } catch (error) {
    next(error);
  }
};

exports.insertInsightHlq = async (req, res, next) => {
  try {
    const conn = await connectSnowflake();
    const { hlq } = req.body;

    if (!hlq) return res.status(400).json({ success: false, message: "HLQ required" });

    const query = `
        INSERT INTO SANDBOX_AI_BI.APP_SCHEMA.INSIGHTS_SCREEN 
        (INSIGHT_TITLE, INSIGHT_BRIEF, INSIGHT_SUMMARY, SQL_QUERY, DATA_POINTS, STATUS, CONFIDENCE_SCORE, CREATED_AT)
        VALUES (?, ?, '', '', '', 'N', 0, CURRENT_TIMESTAMP())
    `;

    await executeSnowflake(conn, query, [hlq.substring(0, 255), hlq]);

    // Snowflake doesn't return Inserted ID easily in Node connector without sequence trick
    // For now, we return success.
    res.json({ success: true, data: { message: "HLQ inserted successfully" } });
  } catch (error) {
    next(error);
  }
};

exports.insertInsightPersona = async (req, res, next) => {
  try {
    const conn = await connectSnowflake();
    const { persona_id, insight_id } = req.body;

    const checkQuery = `SELECT 1 FROM SANDBOX_AI_BI.APP_SCHEMA.INSIGHTS_SCREEN_PERSONA_REF WHERE PERSONA_ID = ? AND INSIGHT_ID = ?`;
    const check = await executeSnowflake(conn, checkQuery, [persona_id, insight_id]);

    if (check.length > 0) return res.json({ success: true, message: "Association already exists" });

    const insertQuery = `INSERT INTO SANDBOX_AI_BI.APP_SCHEMA.INSIGHTS_SCREEN_PERSONA_REF (PERSONA_ID, INSIGHT_ID) VALUES (?, ?)`;
    await executeSnowflake(conn, insertQuery, [persona_id, insight_id]);

    res.json({ success: true, message: "Association created" });
  } catch (error) {
    next(error);
  }
};

exports.fetchPersonaHlq = async (req, res, next) => {
  try {
    const conn = await connectSnowflake();
    const { persona_id } = req.body;

    const query = `
        SELECT i.INSIGHT_ID, i.INSIGHT_TITLE, i.INSIGHT_BRIEF, i.STATUS, i.CREATED_AT
        FROM SANDBOX_AI_BI.APP_SCHEMA.INSIGHTS_SCREEN i
        JOIN SANDBOX_AI_BI.APP_SCHEMA.INSIGHTS_SCREEN_PERSONA_REF r ON i.INSIGHT_ID = r.INSIGHT_ID
        WHERE r.PERSONA_ID = ?
        ORDER BY i.CREATED_AT DESC
    `;

    const rows = await executeSnowflake(conn, query, [persona_id]);
    res.json({ success: true, data: mapToLowerCase(rows) });
  } catch (error) {
    next(error);
  }
};

exports.updateInsightStatus = async (req, res, next) => {
  try {
    const conn = await connectSnowflake();
    const { insight_id, status } = req.body;

    const query = `UPDATE SANDBOX_AI_BI.APP_SCHEMA.INSIGHTS_SCREEN SET STATUS = ?, UPDATED_AT = CURRENT_TIMESTAMP() WHERE INSIGHT_ID = ?`;
    await executeSnowflake(conn, query, [status, insight_id]);

    res.json({ success: true, message: "Insight status updated" });
  } catch (error) {
    next(error);
  }
};

exports.updateBusinessInsight = async (req, res, next) => {
  try {
    const conn = await connectSnowflake();
    const { insight_id, hlq_block, sql_query } = req.body;

    const query = `UPDATE SANDBOX_AI_BI.APP_SCHEMA.INSIGHTS_SCREEN SET INSIGHT_BRIEF = ?, SQL_QUERY = ?, UPDATED_AT = CURRENT_TIMESTAMP() WHERE INSIGHT_ID = ?`;
    await executeSnowflake(conn, query, [hlq_block, sql_query, insight_id]);

    res.json({ success: true, message: "Business insight updated" });
  } catch (error) {
    next(error);
  }
};