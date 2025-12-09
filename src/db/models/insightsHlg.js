"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class InsightsHlg extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  InsightsHlg.init(
    {
      // TODO: define columns to match insights_hlg
    },
    {
      sequelize,
      modelName: "InsightsHlg",
      tableName: "insights_hlg",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return InsightsHlg;
};
