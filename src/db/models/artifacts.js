"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UserArtifacts extends Model {
    static associate(models) {
      UserArtifacts.belongsTo(models.Persona, {
        foreignKey: "persona_id",
        as: "persona",
      });
    }
  }

  UserArtifacts.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      persona_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          // ❌ WAS: model: "Persona", (Defaults to same schema 'dbo')
          // ✅ FIX: Explicitly point to the 'app_non_prod' schema
          model: {
            tableName: "persona", // Changed to snake_case
            schema: "app_non_prod",
          },
          key: "persona_id",
        },
      },
      source_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      source_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      content: {
        type: DataTypes.JSONB,
        allowNull: false,
        // Kept your JSON handling logic
        // get() {
        //   const rawValue = this.getDataValue("content");
        //   try {
        //     return rawValue ? JSON.parse(rawValue) : null;
        //   } catch (e) {
        //     return rawValue;
        //   }
        // },
        // set(value) {
        //   this.setDataValue("content", JSON.stringify(value));
        // },
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW, // Correct for Postgres
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW, // Correct for Postgres
      },
    },
    {
      sequelize,
      modelName: "UserArtifacts",
      tableName: "user_artifacts",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return UserArtifacts;
};