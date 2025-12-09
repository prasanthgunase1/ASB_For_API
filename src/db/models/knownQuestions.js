"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class KnownQuestion extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  KnownQuestion.init(
    {
      // TODO: define columns to match known_questions
    },
    {
      sequelize,
      modelName: "KnownQuestion",
      tableName: "known_questions",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return KnownQuestion;
};
