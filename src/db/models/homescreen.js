const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class HomeScreen extends Model {
    static associate(models) {
      // Define associations here
      HomeScreen.belongsToMany(models.Persona, {
        through: "HomeScreenPersonaRef",
        foreignKey: "visual_id",
        otherKey: "persona_id",
        schema: "app_non_prod",
      });
    }
  }

  HomeScreen.init(
    {
      visual_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      visual_link: DataTypes.TEXT,
      visual_title: DataTypes.STRING(255),
      visual_summary: DataTypes.STRING(500),
      visual_type: DataTypes.STRING(100),
      current_value: DataTypes.STRING(50),
      is_positive_trend: DataTypes.INTEGER,
      percent_change: DataTypes.FLOAT,
      period_type: DataTypes.STRING(50),
      data_points: DataTypes.JSONB,
      priority: DataTypes.INTEGER,
      preference: DataTypes.INTEGER,
      python_code: DataTypes.TEXT,
      sql_query: DataTypes.TEXT,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      status: {
        type: DataTypes.STRING(1),
        defaultValue: "N",
      },
    },
    {
      sequelize,
      modelName: "HomeScreen",
      tableName: "home_screen", // Changed to snake_case
      schema: "app_non_prod",
      timestamps: false,
    }
  );

  return HomeScreen;
};
