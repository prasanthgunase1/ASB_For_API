"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PersonaKPIRef extends Model {
    static associate(models) {
      // Associations are defined in the Persona and KPI models
    }
  }

  PersonaKPIRef.init(
    {
      persona_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: {
            tableName: "Persona",
            schema: "app_non_prod",
          },
          key: "persona_id",
        },
      },
      kpi_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: {
            tableName: "KPIs",
            schema: "app_non_prod",
          },
          key: "kpi_id",
        },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: sequelize.literal.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: sequelize.literal.NOW,
      },
    },
    {
      sequelize,
      modelName: "PersonaKPIRef",
      tableName: "persona_kpi_ref", // Changed to snake_case
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return PersonaKPIRef;
};
