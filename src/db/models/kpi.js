"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class KPI extends Model {
    static associate(models) {
      // Define association with Persona through PersonaKPIRef
      KPI.belongsToMany(models.Persona, {
        through: "PersonaKPIRef",
        foreignKey: "kpi_id",
        otherKey: "persona_id",
        as: "personas",
      });
    }
  }

  KPI.init(
    {
      kpi_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      kpi: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      key_action_levers: {
        type: DataTypes.JSONB,
        allowNull: true,
        // get() {
        //   const value = this.getDataValue("key_action_levers");
        //   return value ? JSON.parse(value) : null;
        // },
        // set(value) {
        //   this.setDataValue(
        //     "key_action_levers",
        //     value ? JSON.stringify(value) : null
        //   );
        // },
      },
      home_screen_status: {
        type: DataTypes.STRING(1),
        allowNull: true,
      },
      automated_insights_status: {
        type: DataTypes.STRING(1),
        allowNull: true,
      },
      higher_the_better_flag: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      kpi_expression: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      kpi_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: sequelize.literal("NOW()"),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: sequelize.literal("NOW()"),
      },
    },
    {
      sequelize,
      modelName: "KPI",
      tableName: "kpis", // Changed to snake_case
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return KPI;
};
