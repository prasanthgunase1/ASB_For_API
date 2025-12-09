"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DbConnection extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  DbConnection.init(
    {
      // TODO: define columns to match db_connections
    },
    {
      sequelize,
      modelName: "DbConnection",
      tableName: "db_connections",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return DbConnection;
};
