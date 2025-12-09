"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class InsightsHlaRef extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  InsightsHlaRef.init(
    {
      // TODO: define columns to match insights_hla_ref
    },
    {
      sequelize,
      modelName: "InsightsHlaRef",
      tableName: "insights_hla_ref",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return InsightsHlaRef;
};
