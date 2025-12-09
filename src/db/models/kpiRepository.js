"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class KpiRepository extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  KpiRepository.init(
    {
      // TODO: define columns to match kpi_repository
    },
    {
      sequelize,
      modelName: "KpiRepository",
      tableName: "kpi_repository",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return KpiRepository;
};
