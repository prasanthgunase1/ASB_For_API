'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Conversation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Conversation.hasMany(models.Message, {
        foreignKey: "conversation_id",
        as: "messages",
        onDelete: "CASCADE",
      });
    }
  }
  Conversation.init({
    user_id: DataTypes.STRING,
    title: DataTypes.STRING,
    conversation_metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      // get() {
      //   const rawValue = this.getDataValue('conversation_metadata');
      //   return rawValue ? JSON.parse(rawValue) : null;
      // },
      // set(value) {
      //   this.setDataValue('conversation_metadata', JSON.stringify(value));
      // },
    },
    created_by: DataTypes.STRING,
    updated_by: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Conversation',
    tableName: 'conversations', // Changed to snake_case
    schema: 'app_non_prod',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
  Conversation.beforeCreate((instance, options) => {
    instance.created_by = options.context.user.username;
    instance.updated_by = options.context.user.username;
  });

  Conversation.beforeUpdate((instance, options) => {
    instance.updated_by = options.context.user.username;
  });
  return Conversation;
};