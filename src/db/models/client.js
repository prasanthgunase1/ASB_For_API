"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Client extends Model {
    static associate(models) {
      Client.hasMany(models.UserAccess, {
        foreignKey: "client_id",
        as: "UserAccesses",
        onDelete: "CASCADE",
      });
    }
  }

  Client.init(
    {
      client_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      client_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      schema_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      schema_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Client",
      tableName: "client", // Changed to snake_case
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Client;
};
