const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class HomeScreenPersonaRef extends Model {
    static associate(models) {
      // Define associations here if needed
    }
  }

  HomeScreenPersonaRef.init(
    {
      persona_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: "Persona",
          key: "persona_id",
        },
      },
      visual_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: "HomeScreen",
          key: "visual_id",
        },
      },
    },
    {
      sequelize,
      modelName: "HomeScreenPersonaRef",
      tableName: "HomeScreenPersonaRef",
      schema: "USR",
      timestamps: false,
    }
  );

  return HomeScreenPersonaRef;
};
