'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableName = 'Files';
    const columnName = 'file_metadata';

    // Step 1: Drop the existing `metadata` column (if it exists)
    await queryInterface.removeColumn(tableName, columnName);

    // Step 2: Add the `metadata` column as NVARCHAR
    await queryInterface.addColumn(tableName, columnName, {
      type: Sequelize.TEXT, // Use NVARCHAR for MSSQL
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    const tableName = 'Files';
    const columnName = 'file_metadata';

    // Step 1: Drop the `metadata` column (if it exists)
    await queryInterface.removeColumn(tableName, columnName);

    // Step 2: Add the `metadata` column as JSON
    await queryInterface.addColumn(tableName, columnName, {
      type: Sequelize.JSON, // Use JSON for MSSQL
      allowNull: true,
    });
  },
};