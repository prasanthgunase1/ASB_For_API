"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PersonaBiDashboardRef extends Model {
    static associate(models) {
      // TODO: define associations
    }
  }

  PersonaBiDashboardRef.init(
    {
      // TODO: define columns to match persona_bi_dashboard_ref
    },
    {
      sequelize,
      modelName: "PersonaBiDashboardRef",
      tableName: "persona_bi_dashboard_ref",
      schema: "app_non_prod",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return PersonaBiDashboardRef;
};
