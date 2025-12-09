'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Message.belongsTo(models.Conversation, {
        foreignKey: "conversation_id",
        as: "conversation",
        onDelete: "CASCADE",
      });
      Message.hasMany(models.Message, {
        foreignKey: "source_msg_id",
        as: "replies",
      });
      Message.hasMany(models.File, {
        foreignKey: "message_id",
        as: "files",
        onDelete: "CASCADE",
      });
    }
  }
  Message.init({
    conversation_id: DataTypes.INTEGER,
    source_msg_id: DataTypes.INTEGER,
    message: {
      type: DataTypes.TEXT,
      allowNull: true, // Added allowNull: true
    },
    message_type: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [['text', 'image', 'video', 'file', 'sticker', 'gif']]
      }
    },
    sender_type: {
      type: DataTypes.ENUM('user', 'chatai'),
      allowNull: false
    },
    metadata: {
        type: DataTypes.JSONB, // Store JSON as a string
        allowNull: true,
        // get() {
        //   const rawValue = this.getDataValue("metadata");
        //   return rawValue ? JSON.parse(rawValue) : null;
        // },
        // set(value) {
        //   this.setDataValue("metadata", JSON.stringify(value));
        // },
    },
    feedback_reaction: DataTypes.STRING,
    created_by: DataTypes.STRING,
    updated_by: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Message',
    tableName: 'messages', // Changed to snake_case
    schema: 'app_non_prod',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
  Message.beforeCreate((instance, options) => {
    instance.created_by = options.context.user.username;
    instance.updated_by = options.context.user.username;
  });

  Message.beforeUpdate((instance, options) => {
    instance.updated_by = options.context.user.username;
  });
  return Message;
};