const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Persona extends Model {
    static associate(models) {
      // Define associations here
      Persona.belongsToMany(models.HomeScreen, {
        through: "HomeScreenPersonaRef",
        foreignKey: "persona_id",
        otherKey: "visual_id",
        schema: "app_non_prod",
      });
      Persona.belongsToMany(models.InsightsScreen, {
        through: models.InsightsScreenPersonaRef,
        foreignKey: "persona_id",
        otherKey: "insight_id",
        schema: "app_non_prod",
      });
      Persona.hasMany(models.UserAccess, {
        foreignKey: "persona_id",
        as: "UserAccesses",
      });
    }
  }

  Persona.init(
    {
      persona_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      persona: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      KPIs: DataTypes.TEXT,
      persona_context: DataTypes.TEXT,
      home_exec_summary: {
        type: DataTypes.JSONB,
        // get() {
        //   const value = this.getDataValue("home_exec_summary");
        //   return value ? value : null;
        // },
        // set(value) {
        //   this.setDataValue(
        //     "home_exec_summary",
        //     value ? JSON.stringify(value) : null
        //   );
        // },
      },
      insights_exec_summary: DataTypes.TEXT,
      created_at: {
        type: DataTypes.DATE,
        // defaultValue: sequelize.literal("GETDATE()"),
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        // defaultValue: sequelize.literal("GETDATE()"),
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Persona",
      tableName: "persona", // Changed to snake_case
      schema: "app_non_prod",
      timestamps: false,
    }
  );

  return Persona;
};
