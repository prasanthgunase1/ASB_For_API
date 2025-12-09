"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UserAccess extends Model {
    static associate(models) {
      UserAccess.belongsTo(models.Industry, {
        foreignKey: "industry_id",
        as: "Industry",
        onDelete: "CASCADE",
      });

      UserAccess.belongsTo(models.Client, {
        foreignKey: "client_id",
        as: "Client",
        onDelete: "CASCADE",
      });

      UserAccess.belongsTo(models.Users, {
        foreignKey: "user_id",
        as: "User",
        onDelete: "CASCADE",
      });

      UserAccess.belongsTo(models.Persona, {
        foreignKey: "persona_id",
        as: "Persona",
        onDelete: "CASCADE",
      });

      UserAccess.belongsTo(models.DataSource, {
        foreignKey: "data_source_id",
        as: "DataSource",
        onDelete: "CASCADE",
      });
    }
  }

  UserAccess.init(
    {
      industry_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: { tableName: "industry", schema: "app_non_prod" },
          key: "industry_id",
        },
      },
      client_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: { tableName: "client", schema: "app_non_prod" },
          key: "client_id",
        },
      },
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: { tableName: "users", schema: "app_non_prod" },
          key: "user_id",
        },
      },
      persona_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: { tableName: "persona", schema: "app_non_prod" },
          key: "persona_id",
        },
      },
      data_source_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: { tableName: "data_source", schema: "app_non_prod" },
          key: "data_source_id",
        },
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "UserAccess",
      tableName: "user_access",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return UserAccess;
};
