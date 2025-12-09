"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DashboardSummary extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  DashboardSummary.init(
    {
      // TODO: define columns to match dashboard_summary
    },
    {
      sequelize,
      modelName: "DashboardSummary",
      tableName: "dashboard_summary",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return DashboardSummary;
};
