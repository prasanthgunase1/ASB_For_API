"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    static associate(models) {
      // Add associations if needed
    }
  }

  Task.init(
    {
      task_id: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.STRING(255), // Changed from INTEGER to STRING to support UUIDs
        allowNull: false,
      },
      chat_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      result: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("GETDATE()"),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("GETDATE()"),
      },
    },
    {
      sequelize,
      modelName: "Task",
      tableName: "tasks",
      schema: "RGM",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      hooks: {
        beforeUpdate: (task) => {
          task.updated_at = sequelize.literal("GETDATE()");
        },
      },
    }
  );

  return Task;
};
