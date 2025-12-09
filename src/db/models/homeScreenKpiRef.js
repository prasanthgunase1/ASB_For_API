"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class HomeScreenKpiRef extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  HomeScreenKpiRef.init(
    {
      // TODO: define columns to match home_screen_kpi_ref
    },
    {
      sequelize,
      modelName: "HomeScreenKpiRef",
      tableName: "home_screen_kpi_ref",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return HomeScreenKpiRef;
};
