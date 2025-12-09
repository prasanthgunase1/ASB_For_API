"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PersonaDocumentsRef extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  PersonaDocumentsRef.init(
    {
      // TODO: define columns to match persona_documents_ref
    },
    {
      sequelize,
      modelName: "PersonaDocumentsRef",
      tableName: "persona_documents_ref",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return PersonaDocumentsRef;
};
