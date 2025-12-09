"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PersonaDbConnectionRef extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  PersonaDbConnectionRef.init(
    {
      // TODO: define columns to match persona_db_connection_ref
    },
    {
      sequelize,
      modelName: "PersonaDbConnectionRef",
      tableName: "persona_db_connection_ref",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return PersonaDbConnectionRef;
};
