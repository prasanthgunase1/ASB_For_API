"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Industry extends Model {
    static associate(models) {
      Industry.hasMany(models.UserAccess, {
        foreignKey: "industry_id",
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
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Industry",
      tableName: "Industry",
      schema: "USR",
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Industry;
};
