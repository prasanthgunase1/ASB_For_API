"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class BiDashboard extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  BiDashboard.init(
    {
      // TODO: define columns to match bi_dashboards
    },
    {
      sequelize,
      modelName: "BiDashboard",
      tableName: "bi_dashboards",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return BiDashboard;
};
