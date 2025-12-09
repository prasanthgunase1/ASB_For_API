"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
   const { Sequelize } = require("sequelize");
  class InsightsScreen extends Model {
    static associate(models) {
      // Define association with Persona through InsightsScreenPersonaRef
      InsightsScreen.belongsToMany(models.Persona, {
        through: "InsightsScreenPersonaRef",
        foreignKey: "insight_id",
        otherKey: "persona_id",
      });
    }
  }

  InsightsScreen.init(
    {
      insight_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      insight_title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      insight_brief: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      insight_faqs: {
        type: DataTypes.JSONB,
        allowNull: true,
        // get() {
        //   const value = this.getDataValue("insight_faqs");
        //   return value ? JSON.parse(value) : null;
        // },
        // set(value) {
        //   this.setDataValue(
        //     "insight_faqs",
        //     value ? JSON.stringify(value) : null
        //   );
        // },
      },
      insight_anomaly_data_points: {
        type: DataTypes.JSONB,
        allowNull: true,
        // get() {
        //   const value = this.getDataValue("insight_anomaly_data_points");
        //   return value ? JSON.parse(value) : null;
        // },
        // set(value) {
        //   this.setDataValue(
        //     "insight_anomaly_data_points",
        //     value ? JSON.stringify(value) : null
        //   );
        // },
      },
      sql_query: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      data_points: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      insight_summary: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      insight_visual_link: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(1),
        allowNull: true,
        defaultValue: "N",
      },
      hlq: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      hlq_block: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
      explainability_summary: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      confidence_score: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "InsightsScreen",
      tableName: "insights_screen", // Changed to snake_case
      schema: "app_non_prod",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return InsightsScreen;
};
