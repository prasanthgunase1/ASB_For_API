"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Workflow extends Model {
    static associate(models) {
      // Define associations here if needed
    }
  }

  Workflow.init(
    {
      workflow_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
        primaryKey: true,
      },
      workflow_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      created_by: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW, // ✅ Let Postgres handle the time automatically
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        // get() {
        //   try {
        //     const raw = this.getDataValue("metadata");
        //     return raw ? JSON.parse(raw) : null;
        //   } catch (e) {
        //     console.error("Error parsing metadata JSON:", e);
        //     return this.getDataValue("metadata");
        //   }
        // },
        // set(val) {
        //   try {
        //     this.setDataValue("metadata", val ? JSON.stringify(val) : null);
        //   } catch (e) {
        //     console.error("Error stringifying metadata:", e);
        //     this.setDataValue("metadata", val);
        //   }
        // },
      },
      workflow_steps: {
        type: DataTypes.JSONB,
        allowNull: true,
        // get() {
        //   try {
        //     const raw = this.getDataValue("workflow_steps");
        //     return raw ? JSON.parse(raw) : null;
        //   } catch (e) {
        //     console.error("Error parsing workflow_steps JSON:", e);
        //     return this.getDataValue("workflow_steps");
        //   }
        // },
        // set(val) {
        //   try {
        //     this.setDataValue(
        //       "workflow_steps",
        //       val ? JSON.stringify(val) : null
        //     );
        //   } catch (e) {
        //     console.error("Error stringifying workflow_steps:", e);
        //     this.setDataValue("workflow_steps", val);
        //   }
        // },
      },
    },
    {
      sequelize,
      modelName: "Workflow",
      tableName: "workflows",
      schema: "app_non_prod",
      timestamps: false, // Critical change - no timestamp columns in the database
      freezeTableName: true,
    }
  );

  // Hooks to manage the created_by field without created_at/updated_at
  Workflow.beforeCreate((instance, options) => {
    try {
      if (options.context && options.context.user) {
        instance.created_by = options.context.user.username;
      }
      // Set timestamp instead of created_at/updated_at
      instance.timestamp = new Date();
    } catch (error) {
      console.error("Error in Workflow beforeCreate hook:", error);
    }
  });

  Workflow.beforeUpdate((instance, options) => {
    try {
      // Update timestamp on every update
      instance.timestamp = new Date();
    } catch (error) {
      console.error("Error in Workflow beforeUpdate hook:", error);
    }
  });

  return Workflow;
};
