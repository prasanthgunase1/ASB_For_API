"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Restore Foreign Key: Messages.conversation_id → Conversations.id
    await queryInterface.addConstraint("Messages", {
      fields: ["conversation_id"],
      type: "foreign key",
      name: "FK__Messages__conver__6EC0713C",
      references: {
        table: "Conversations",
        field: "id",
      },
    });

    // Restore Foreign Key: Messages.source_msg_id → Messages.id
    await queryInterface.addConstraint("Messages", {
      fields: ["source_msg_id"],
      type: "foreign key",
      name: "FK__Messages__source__6FB49575",
      references: {
        table: "Messages",
        field: "id",
      },
    });

    // Restore Foreign Key: Files.message_id → Messages.id
    await queryInterface.addConstraint("Files", {
      fields: ["message_id"],
      type: "foreign key",
      name: "FK__Files__message_i__72910220",
      references: {
        table: "Messages",
        field: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove Foreign Key: Messages.conversation_id
    await queryInterface.removeConstraint("Messages", "FK__Messages__conver__6EC0713C");

    // Remove Foreign Key: Messages.source_msg_id
    await queryInterface.removeConstraint("Messages", "FK__Messages__source__6FB49575");

    // Remove Foreign Key: Files.message_id
    await queryInterface.removeConstraint("Files", "FK__Files__message_i__72910220");
  },
};
