"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PersonaDocument extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  PersonaDocument.init(
    {
      // TODO: define columns to match persona_documents
    },
    {
      sequelize,
      modelName: "PersonaDocument",
      tableName: "persona_documents",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return PersonaDocument;
};
