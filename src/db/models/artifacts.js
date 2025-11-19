"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UserArtifacts extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define association to the Persona model
      UserArtifacts.belongsTo(models.Persona, {
        foreignKey: "persona_id",
        as: "persona",
      });

      // Define association to a User model if you have one
      // UserArtifacts.belongsTo(models.User, {
      //   foreignKey: "user_id",
      //   as: "user",
      // });
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
          model: "Persona", // This should match the model name of your Persona model
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
        type: DataTypes.TEXT, // Use TEXT for NVARCHAR(MAX)
        allowNull: false,
        get() {
          const rawValue = this.getDataValue("content");
          // Safely parse the JSON string
          try {
            return rawValue ? JSON.parse(rawValue) : null;
          } catch (e) {
            return rawValue; // Return as string if parsing fails
          }
        },
        set(value) {
          // Safely stringify the JSON object
          this.setDataValue("content", JSON.stringify(value));
        },
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("GETUTCDATE()"),
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("GETUTCDATE()"),
      },
    },
    {
      sequelize,
      modelName: "UserArtifacts",
      tableName: "user_artifacts", // The exact table name in your DB
      schema: "dbo", // The exact schema in your DB
      timestamps: true, // Let Sequelize manage created_at and updated_at
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return UserArtifacts;
};
