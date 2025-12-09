"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class InsightsScreen extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  InsightsScreen.init(
    {
      // TODO: define columns to match insights_screen
    },
    {
      sequelize,
      modelName: "InsightsScreen",
      tableName: "insights_screen",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return InsightsScreen;
};

