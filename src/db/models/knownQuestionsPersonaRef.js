"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class KnownQuestionsPersonaRef extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  KnownQuestionsPersonaRef.init(
    {
      // TODO: define columns to match known_questions_persona_ref
    },
    {
      sequelize,
      modelName: "KnownQuestionsPersonaRef",
      tableName: "known_questions_persona_ref",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return KnownQuestionsPersonaRef;
};
