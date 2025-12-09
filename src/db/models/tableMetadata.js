"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TableMetadata extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  TableMetadata.init(
    {
      // TODO: define columns to match table_metadata
    },
    {
      sequelize,
      modelName: "TableMetadata",
      tableName: "table_metadata",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return TableMetadata;
};
