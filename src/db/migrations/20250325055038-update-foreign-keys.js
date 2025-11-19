'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Drop only the required foreign keys
      await queryInterface.removeConstraint('Messages', 'FK__Messages__conver__6EC0713C', { transaction });
      await queryInterface.removeConstraint('Files', 'FK__Files__message_i__72910220', { transaction });
      // Add ON DELETE CASCADE only where needed
      await queryInterface.addConstraint('Messages', {
        fields: ['conversation_id'],
        type: 'foreign key',
        name: 'FK__Messages__conver__6EC0713C',
        references: {
          table: 'Conversations',
          field: 'id',
        },
        onDelete: 'CASCADE',
        transaction,
      });

      await queryInterface.addConstraint('Files', {
        fields: ['message_id'],
        type: 'foreign key',
        name: 'FK__Files__message_i__72910220',
        references: {
          table: 'Messages',
          field: 'id',
        },
        onDelete: 'CASCADE',
        transaction,
      });
      await transaction.commit();
    } catch (error) {
      console.error('Error in migration:', error);
      if (transaction.finished !== 'rollback') {
        await transaction.rollback();
      }
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Remove only the newly added constraints
      await queryInterface.removeConstraint('Messages', 'FK__Messages__conver__6EC0713C', { transaction });
      await queryInterface.removeConstraint('Files', 'FK__Files__message_i__72910220', { transaction });
      // Restore old foreign keys without ON DELETE CASCADE
      await queryInterface.addConstraint('Messages', {
        fields: ['conversation_id'],
        type: 'foreign key',
        name: 'FK__Messages__conver__6EC0713C',
        references: {
          table: 'Conversations',
          field: 'id',
        },
        transaction,
      });
      await queryInterface.addConstraint('Files', {
        fields: ['message_id'],
        type: 'foreign key',
        name: 'FK__Files__message_i__72910220',
        references: {
          table: 'Messages',
          field: 'id',
        },
        transaction,
      });
      await transaction.commit();
    } catch (error) {
      console.error('Error in rollback:', error);
      if (transaction.finished !== 'rollback') {
        await transaction.rollback();
      }
      throw error;
    }
  },
};
