'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.renameColumn('Files', 'createdAt', 'created_at');
    await queryInterface.renameColumn('Files', 'updatedAt', 'updated_at');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.renameColumn('Files', 'created_at', 'createdAt');
    await queryInterface.renameColumn('Files', 'updated_at', 'updatedAt');
  }
};
