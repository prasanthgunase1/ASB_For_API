"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class File extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      File.belongsTo(models.Message, {
        foreignKey: "message_id",
        as: "message",
        onDelete: "CASCADE",
      });
    }
  }
  File.init(
    {
      message_id: DataTypes.INTEGER,
      user_id: DataTypes.STRING,
      file_url: DataTypes.STRING,
      file_size: DataTypes.INTEGER,
      file_type: DataTypes.STRING,
      file_name: DataTypes.STRING,
      file_metadata: {
        type: DataTypes.JSONB, // Store JSON as a string
        allowNull: true,
        // get() {
        //   const rawValue = this.getDataValue("file_metadata");
        //   return rawValue ? JSON.parse(rawValue) : null;
        // },
        // set(value) {
        //   this.setDataValue("file_metadata", JSON.stringify(value));
        // },
      },
      created_by: DataTypes.STRING,
      updated_by: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "File",
      tableName: "files", // Changed to snake_case
      schema: 'app_non_prod',
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  File.beforeCreate((instance, options) => {
    if (!instance.user_id && options.context?.user?.username) {
      instance.user_id = options.context.user.username;
    }

    instance.created_by = options.context?.user?.username || "system";
    instance.updated_by = options.context?.user?.username || "system";
  });

  File.beforeUpdate((instance, options) => {
    instance.updated_by = options.context.user.username;
  });
  return File;
};
