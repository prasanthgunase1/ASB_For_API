"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class InsightAnomaly extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  InsightAnomaly.init(
    {
      // TODO: define columns to match insight_anomalies
    },
    {
      sequelize,
      modelName: "InsightAnomaly",
      tableName: "insight_anomalies",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return InsightAnomaly;
};
