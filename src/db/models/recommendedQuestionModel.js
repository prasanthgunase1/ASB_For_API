const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class RecommendedQuestion extends Model {
    static associate(models) {
      // Define associations here if needed
    }
  }

  RecommendedQuestion.init(
    {
      // Defines the columns of your USR.RecommendedQuestions table
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      persona_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      questions_json: {
        type: DataTypes.STRING, // Corresponds to nvarchar
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "RecommendedQuestion",
      tableName: "RecommendedQuestions", // The exact table name in your DB
      schema: "USR",                   // The exact schema in your DB
      timestamps: false,               // Disable created_at/updated_at columns
    }
  );

  return RecommendedQuestion;
};