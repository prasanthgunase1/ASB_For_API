"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class AiForBiUploadedDocument extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  AiForBiUploadedDocument.init(
    {
      // TODO: define columns to match ai_for_bi_uploaded_documents
    },
    {
      sequelize,
      modelName: "AiForBiUploadedDocument",
      tableName: "ai_for_bi_uploaded_documents",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return AiForBiUploadedDocument;
};
