"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "workflows", // Changed to lowercase to match SQL script
      {
        workflow_id: {
          type: Sequelize.STRING(100),
          allowNull: false,
          primaryKey: true,
        },
        workflow_name: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        created_by: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        timestamp: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        metadata: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        workflow_steps: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("GETDATE()"),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("GETDATE()"),
        },
        updated_by: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
      },
      {
        schema: "USR",
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable({ tableName: "workflows", schema: "USR" }); // Changed to lowercase
  },
};
