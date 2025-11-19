const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class InsightsScreenPersonaRef extends Model {
    static associate(models) {
      // Associations are defined in the parent models
    }
  }

  InsightsScreenPersonaRef.init(
    {
      persona_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: "Persona",
          key: "persona_id",
        },
      },
      insight_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: "InsightsScreen",
          key: "insight_id",
        },
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "InsightsScreenPersonaRef",
      tableName: "InsightsScreenPersonaRef",
      schema: "USR",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return InsightsScreenPersonaRef;
};
