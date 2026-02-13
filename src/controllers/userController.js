const statusCodes = require("../utils/statusCodes");
const { connectSnowflake } = require("../config/database");

// Helper: Map Snowflake UPPERCASE columns to lowercase keys
const mapToLowerCase = (rows) => {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.map((row) => {
    const newRow = {};
    for (const key in row) {
      newRow[key.toLowerCase()] = row[key];
    }
    return newRow;
  });
};

exports.getUserData = async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email) {
      const error = new Error("Email is required");
      error.statusCode = statusCodes.BAD_REQUEST;
      throw error;
    }

    const conn = await connectSnowflake();

    // Updated Query:
    // 1. Removed [brackets]
    // 2. Used SANDBOX_AI_BI.APP_SCHEMA prefix
    // 3. Changed :email to ?
    const query = `
      SELECT DISTINCT 
        i.INDUSTRY_ID, 
        i.INDUSTRY_NAME,
        u.CLIENT_ID, 
        p.PERSONA,
        p.PERSONA_ID,
        u.USER_ID,
        c.DATA_DOMAIN 
      FROM SANDBOX_AI_BI.APP_SCHEMA.PERSONA p 
      JOIN SANDBOX_AI_BI.APP_SCHEMA.USER_ACCESS u ON p.PERSONA_ID = u.PERSONA_ID 
      JOIN SANDBOX_AI_BI.APP_SCHEMA.USERS us ON us.USER_ID = u.USER_ID
      JOIN SANDBOX_AI_BI.APP_SCHEMA.INDUSTRY i ON u.INDUSTRY_ID = i.INDUSTRY_ID
      JOIN SANDBOX_AI_BI.APP_SCHEMA.CLIENT c ON c.CLIENT_ID = u.CLIENT_ID
      WHERE us.EMAIL = ?
    `;

    // Execute Snowflake Query
    const rows = await new Promise((resolve, reject) => {
      conn.execute({
        sqlText: query,
        binds: [email],
        complete: (err, stmt, rows) => {
          if (err) {
            console.error("❌ Snowflake Error:", err.message);
            return reject(err);
          }
          resolve(rows);
        },
      });
    });

    const userData = mapToLowerCase(rows);

    if (!userData || userData.length === 0) {
      const error = new Error("User not found");
      error.statusCode = statusCodes.NOT_FOUND;
      throw error;
    }

    res.status(statusCodes.SUCCESS).json({
      status: statusCodes.SUCCESS,
      success: true,
      message: "User data fetched successfully",
      data: userData,
    });
  } catch (error) {
    next(error);
  }
};

exports.getLoggedInUserInfo = async (req, res, next) => {
  try {
    // Check if req.user exists AFTER the middleware has run
    if (!req.user) {
      const error = new Error("User not found or unauthorized");
      error.statusCode = statusCodes.UNAUTHORIZED;
      throw error;
    }
    
    // No DB call needed here, data comes from middleware token
    const userData = {
      username: req.user.name,
      userId: req.user.userId,
      email: req.user.email,
      image_url: req.user.image_url,
      // ... other user information
    };

    res.status(statusCodes.SUCCESS).json({
      status: statusCodes.SUCCESS,
      success: true,
      message: "User info fetched successfully",
      data: userData,
    });
  } catch (error) {
    next(error);
  }
};