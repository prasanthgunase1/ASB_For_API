// Use require() for CommonJS modules
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

// Use exports to make the function available
exports.getRecommendedQuestions = async (req, res) => {
  const { persona_id, screen_type } = req.query;

  if (!persona_id || !screen_type) {
    return res.status(400).json({ error: 'persona_id and screen_type are required.' });
  }

  try {
    const conn = await connectSnowflake();

    // SQL Update: Removed [brackets], added Schema prefix, used ? for binding
    const sqlQuery = `
      SELECT * FROM SANDBOX_AI_BI.APP_SCHEMA.RECOMMENDED_QUESTIONS
      WHERE PERSONA_ID = ?
    `;

    // Execute Snowflake Query
    const rows = await new Promise((resolve, reject) => {
      conn.execute({
        sqlText: sqlQuery,
        binds: [parseInt(persona_id, 10)],
        complete: (err, stmt, rows) => {
          if (err) {
            console.error("❌ Snowflake Error:", err.message);
            return reject(err);
          }
          resolve(rows);
        },
      });
    });

    const recommendations = mapToLowerCase(rows);

    if (recommendations.length === 0) {
      return res.status(200).json([]);
    }

    const recommendation = recommendations[0];
    let allQuestions = {};

    // Handle JSON parsing (Snowflake usually returns string for variant/text)
    if (typeof recommendation.questions_json === 'string') {
        try {
            allQuestions = JSON.parse(recommendation.questions_json);
        } catch (e) {
            console.warn("Failed to parse questions_json:", e.message);
            allQuestions = {};
        }
    } else {
        allQuestions = recommendation.questions_json || {};
    }

    const specificQuestions = allQuestions[screen_type] || [];

    res.status(200).json(specificQuestions);
  } catch (error) {
    console.error('Error fetching recommended questions:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
};