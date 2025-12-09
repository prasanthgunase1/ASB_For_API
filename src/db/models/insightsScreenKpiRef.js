"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class InsightsScreenKpiRef extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  InsightsScreenKpiRef.init(
    {
      // TODO: define columns to match insights_screen_kpi_ref
    },
    {
      sequelize,
      modelName: "InsightsScreenKpiRef",
      tableName: "insights_screen_kpi_ref",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return InsightsScreenKpiRef;
};
