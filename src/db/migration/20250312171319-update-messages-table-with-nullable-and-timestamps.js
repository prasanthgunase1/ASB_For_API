'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Messages', 'message', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.renameColumn('Messages', 'createdAt', 'created_at');
    await queryInterface.renameColumn('Messages', 'updatedAt', 'updated_at');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Messages', 'message', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
    await queryInterface.renameColumn('Messages', 'created_at', 'createdAt');
    await queryInterface.renameColumn('Messages', 'updated_at', 'updatedAt');
  }
};
