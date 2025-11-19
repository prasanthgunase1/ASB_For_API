"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UserAccess extends Model {
    static associate(models) {
      UserAccess.belongsTo(models.Client, {
        foreignKey: "client_id",
        as: "Client",
        onDelete: "CASCADE",
      });
      UserAccess.belongsTo(models.DataSource, {
        foreignKey: "data_source_id",
        as: "DataSource",
        onDelete: "CASCADE",
      });
      UserAccess.belongsTo(models.Industry, {
        foreignKey: "industry_id",
        as: "Industry",
        onDelete: "CASCADE",
      });
      UserAccess.belongsTo(models.Persona, {
        foreignKey: "persona_id",
        as: "Persona",
        onDelete: "CASCADE",
      });
      UserAccess.belongsTo(models.Users, {
        foreignKey: "user_id",
        as: "User",
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
          model: "Industry",
          key: "industry_id",
        },
      },
      client_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: "Client",
          key: "client_id",
        },
      },
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: "Users",
          key: "user_id",
        },
      },
      persona_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: "Persona",
          key: "persona_id",
        },
      },
      data_source_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: "DataSource",
          key: "data_source_id",
        },
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "UserAccess",
      tableName: "UserAccess",
      schema: "USR",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return UserAccess;
};
