"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SqlTemplate extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  SqlTemplate.init(
    {
      // TODO: define columns to match sql_templates
    },
    {
      sequelize,
      modelName: "SqlTemplate",
      tableName: "sql_templates",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return SqlTemplate;
};
