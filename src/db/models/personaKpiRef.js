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
            schema: "USR",
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
            schema: "USR",
          },
          key: "kpi_id",
        },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: sequelize.literal("GETDATE()"),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: sequelize.literal("GETDATE()"),
      },
    },
    {
      sequelize,
      modelName: "PersonaKPIRef",
      tableName: "PersonaKPIRef",
      schema: "USR",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return PersonaKPIRef;
};
