"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DataSource extends Model {
    static associate(models) {
      DataSource.hasMany(models.UserAccess, {
        foreignKey: "data_source_id",
        as: "UserAccesses",
        onDelete: "CASCADE",
      });
    }
  }

  DataSource.init(
    {
      data_source_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      data_source_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      schema_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "DataSource",
      tableName: "data_source", // Changed to snake_case
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return DataSource;
};
