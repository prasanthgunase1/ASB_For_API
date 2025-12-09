"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class KpiActivity extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  KpiActivity.init(
    {
      // TODO: define columns to match kpi_activity
    },
    {
      sequelize,
      modelName: "KpiActivity",
      tableName: "kpi_activity",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return KpiActivity;
};
