"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UserSqlQuery extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  UserSqlQuery.init(
    {
      // TODO: define columns to match user_sql_query
    },
    {
      sequelize,
      modelName: "UserSqlQuery",
      tableName: "user_sql_query",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return UserSqlQuery;
};
