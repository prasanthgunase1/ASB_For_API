'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.renameColumn('Conversations', 'createdAt', 'created_at');
    await queryInterface.renameColumn('Conversations', 'updatedAt', 'updated_at');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.renameColumn('Conversations', 'created_at', 'createdAt');
    await queryInterface.renameColumn('Conversations', 'updated_at', 'updatedAt');
  }
};
