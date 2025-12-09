"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class KpiManagement extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  KpiManagement.init(
    {
      // TODO: define columns to match kpi_management
    },
    {
      sequelize,
      modelName: "KpiManagement",
      tableName: "kpi_management",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return KpiManagement;
};
