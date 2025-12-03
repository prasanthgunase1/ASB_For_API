'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Messages', 'message_type', {
      type: Sequelize.STRING,
      allowNull: true,
      validate: {
        isIn: [['text', 'image', 'video', 'file', 'sticker', 'gif']]
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Messages', 'message_type');
  }
};
