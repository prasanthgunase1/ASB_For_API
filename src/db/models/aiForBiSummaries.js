"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class AiForBiSummary extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  AiForBiSummary.init(
    {
      // TODO: define columns to match ai_for_bi_summaries
    },
    {
      sequelize,
      modelName: "AiForBiSummary",
      tableName: "ai_for_bi_summaries",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return AiForBiSummary;
};
