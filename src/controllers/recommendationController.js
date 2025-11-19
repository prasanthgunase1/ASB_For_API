// Use require() for CommonJS modules
const { QueryTypes } = require('sequelize');

// ✅ Best Practice: Get the sequelize instance from your central models file
const { sequelize } = require("../db/models");

// Use exports to make the function available
exports.getRecommendedQuestions = async (req, res) => {
  const { persona_id, screen_type } = req.query;

  if (!persona_id || !screen_type) {
    return res.status(400).json({ error: 'persona_id and screen_type are required.' });
  }

  try {
    const sqlQuery = `
      SELECT * FROM [USR].[RecommendedQuestions]
      WHERE persona_id = :persona_id
    `;

    const recommendations = await sequelize.query(sqlQuery, {
      replacements: { persona_id: parseInt(persona_id, 10) },
      type: QueryTypes.SELECT,
    });

    if (recommendations.length === 0) {
      return res.status(200).json([]);
    }

    const recommendation = recommendations[0];
    const allQuestions = JSON.parse(recommendation.questions_json);
    const specificQuestions = allQuestions[screen_type] || [];

    res.status(200).json(specificQuestions);
  } catch (error) {
    console.error('Error fetching recommended questions:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
};