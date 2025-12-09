"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Industry extends Model {
    static associate(models) {
      Industry.hasMany(models.UserAccess, {
        foreignKey: "industry_id",
        as: "UserAccess",
        onDelete: "CASCADE",
      });
    }
  }

  Industry.init(
    {
      industry_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      industry_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
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
      modelName: "Industry",
      tableName: "industry",
      schema: "app_non_prod",
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Industry;
};
