"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class KpiInfo extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  KpiInfo.init(
    {
      // TODO: define columns to match kpi_info
    },
    {
      sequelize,
      modelName: "KpiInfo",
      tableName: "kpi_info",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return KpiInfo;
};
