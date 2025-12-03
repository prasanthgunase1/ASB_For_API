"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * 1. Create Schemas
     * PostgreSQL requires schemas to be created explicitly before tables can be added to them.
     */
    await queryInterface.createSchema("USR");
    await queryInterface.createSchema("RGM");
    // 'dbo' is standard in SQL Server. We create it here to match your UserArtifacts model.
    // If you prefer 'public', change schema: 'dbo' to schema: 'public' in the UserArtifacts table definition below.
    await queryInterface.createSchema("DBO"); 

    /**
     * 2. Independent Tables (No Foreign Keys)
     */

    // Users (Schema: USR)
    await queryInterface.createTable(
      { tableName: "Users", schema: "USR" },
      {
        user_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        user_name: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        email: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      }
    );

    // Client (Schema: USR)
    await queryInterface.createTable(
      { tableName: "Client", schema: "USR" },
      {
        client_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        client_name: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        schema_name: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        schema_description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        created_at: Sequelize.DATE,
        updated_at: Sequelize.DATE,
      }
    );
    
// await queryInterface.createTable(
//   { tableName: "Client", schema: "USR" }, // Note plural "Clients"
//   {
//     client_id: {
//       type: Sequelize.INTEGER,
//       primaryKey: true,
//       autoIncrement: true, // This handles IDENTITY(1,1)
//     },
//     client_name: {
//       type: Sequelize.STRING(200),
//       allowNull: true, // Changed to match your SQL implication
//     },
//     poc_name: {
//       type: Sequelize.STRING(100),
//       allowNull: true,
//     },
//     poc_email: {
//       type: Sequelize.STRING(200),
//       allowNull: true,
//     },
//     deposit_balance: {
//       type: Sequelize.DECIMAL(18, 2), // Precision 18, Scale 2
//       allowNull: true,
//     },
//     loan_outstanding: {
//       type: Sequelize.DECIMAL(18, 2),
//       allowNull: true,
//     },
//     net_profit: {
//       type: Sequelize.DECIMAL(18, 2),
//       allowNull: true,
//     },
//     financial_score: {
//       type: Sequelize.DECIMAL(4, 1), // Precision 4, Scale 1 (e.g. 8.1)
//       allowNull: true,
//     },
//     relationship_score: {
//       type: Sequelize.DECIMAL(4, 1),
//       allowNull: true,
//     },
//     risk_score: {
//       type: Sequelize.DECIMAL(4, 1),
//       allowNull: true,
//     },
//     last_updated: {
//       type: Sequelize.DATE, // Maps to DATETIME
//       allowNull: true,
//     },
//     // Sequelize usually adds these automatically unless disabled in model
//     created_at: {
//         type: Sequelize.DATE,
//         defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
//     },
//     updated_at: Sequelize.DATE,
//   }
// );


    // Industry (Schema: USR)
    await queryInterface.createTable(
      { tableName: "Industry", schema: "USR" },
      {
        industry_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        industry_name: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        created_at: Sequelize.DATE,
        updated_at: Sequelize.DATE,
      }
    );

    // DataSource (Schema: USR)
    await queryInterface.createTable(
      { tableName: "DataSource", schema: "USR" },
      {
        data_source_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        data_source_name: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        schema_name: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        created_at: Sequelize.DATE,
        updated_at: Sequelize.DATE,
      }
    );

    // Persona (Schema: USR)
    await queryInterface.createTable(
      { tableName: "Persona", schema: "USR" },
      {
        persona_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        persona: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        KPIs: Sequelize.TEXT,
        persona_context: Sequelize.TEXT,
        home_exec_summary: Sequelize.TEXT,
        insights_exec_summary: Sequelize.TEXT,
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      }
    );

    // HomeScreen (Schema: USR)
    await queryInterface.createTable(
      { tableName: "HomeScreen", schema: "USR" },
      {
        visual_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        visual_link: Sequelize.TEXT,
        visual_title: Sequelize.STRING(255),
        visual_summary: Sequelize.STRING(500),
        visual_type: Sequelize.STRING(100),
        current_value: Sequelize.STRING(50),
        is_positive_trend: Sequelize.BOOLEAN,
        percent_change: Sequelize.FLOAT,
        period_type: Sequelize.STRING(50),
        data_points: Sequelize.TEXT,
        priority: Sequelize.INTEGER,
        preference: Sequelize.INTEGER,
        python_code: Sequelize.TEXT,
        sql_query: Sequelize.TEXT,
        status: {
          type: Sequelize.STRING(1),
          defaultValue: "N",
        },
        created_at: Sequelize.DATE,
        updated_at: Sequelize.DATE,
      }
    );

    // InsightsScreen (Schema: USR)
    await queryInterface.createTable(
      { tableName: "InsightsScreen", schema: "USR" },
      {
        insight_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        insight_title: Sequelize.STRING(255),
        insight_brief: Sequelize.TEXT,
        insight_faqs: Sequelize.TEXT,
        insight_anomaly_data_points: Sequelize.TEXT,
        sql_query: Sequelize.TEXT,
        data_points: Sequelize.TEXT,
        insight_summary: Sequelize.TEXT,
        insight_visual_link: Sequelize.TEXT,
        status: {
          type: Sequelize.STRING(1),
          defaultValue: "N",
        },
        hlq: Sequelize.STRING(500),
        hlq_block: Sequelize.TEXT,
        explainability_summary: Sequelize.TEXT,
        confidence_score: Sequelize.FLOAT,
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      }
    );

    // KPIs (Schema: USR)
    await queryInterface.createTable(
      { tableName: "KPIs", schema: "USR" },
      {
        kpi_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        kpi: Sequelize.STRING(255),
        key_action_levers: Sequelize.TEXT,
        home_screen_status: Sequelize.STRING(1),
        automated_insights_status: Sequelize.STRING(1),
        higher_the_better_flag: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        kpi_expression: Sequelize.TEXT,
        kpi_description: Sequelize.TEXT,
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      }
    );

    // Workflows (Schema: USR)
    await queryInterface.createTable(
      { tableName: "workflows", schema: "USR" },
      {
        workflow_id: {
          type: Sequelize.STRING(100),
          allowNull: false,
          primaryKey: true,
        },
        workflow_name: Sequelize.STRING(255),
        created_by: Sequelize.STRING(255),
        timestamp: Sequelize.DATE,
        metadata: Sequelize.TEXT, // Mapped from TEXT('long')
        workflow_steps: Sequelize.TEXT, // Mapped from TEXT('long')
      }
    );

    // Conversations (Default Schema / Public)
    await queryInterface.createTable({ schema: 'DBO', tableName: 'Conversations' }, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: Sequelize.STRING,
      title: Sequelize.STRING,
      conversation_metadata: Sequelize.TEXT,
      created_by: Sequelize.STRING,
      updated_by: Sequelize.STRING,
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    /**
     * 3. Tables with Foreign Keys (Dependent Tables)
     */

    // UserArtifacts (Schema: dbo)
    await queryInterface.createTable(
      { tableName: "user_artifacts", schema: "DBO" },
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        persona_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: {
              tableName: "Persona",
              schema: "USR",
            },
            key: "persona_id",
          },
        },
        source_type: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        source_id: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        content: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      }
    );

    // RecommendedQuestions (Schema: USR)
    // Note: Logic suggests persona_id is an FK, but model didn't define strictly. Added simply.
    await queryInterface.createTable(
      { tableName: "RecommendedQuestions", schema: "USR" },
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        persona_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        questions_json: {
          type: Sequelize.STRING,
          allowNull: false,
        },
      }
    );

    // Tasks (Schema: RGM)
    await queryInterface.createTable(
      { tableName: "tasks", schema: "RGM" },
      {
        task_id: {
          type: Sequelize.STRING(64),
          primaryKey: true,
          allowNull: false,
        },
        user_id: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        chat_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        status: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        result: Sequelize.TEXT,
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      }
    );

    // Messages (Default/Public Schema)
    await queryInterface.createTable({ schema: "DBO", tableName: "Message" }, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      conversation_id: {
        type: Sequelize.INTEGER,
        references: {
        model: {
            tableName: "Conversations",
            schema: "DBO",
          },
          key: "id",
        },
        onDelete: "CASCADE",
      },
      source_msg_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      message_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sender_type: {
        type: Sequelize.ENUM("user", "chatai"),
        allowNull: false,
      },
      metadata: Sequelize.TEXT,
      feedback_reaction: Sequelize.STRING,
      created_by: Sequelize.STRING,
      updated_by: Sequelize.STRING,
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Files (Default/Public Schema)
    await queryInterface.createTable({ schema: "DBO", tableName: "Files" }, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      message_id: {
        type: Sequelize.INTEGER,
        references: {
         model: {
            tableName: "Message",
            schema: "DBO",
          },
          key: "id",
        },
        onDelete: "CASCADE",
      },
      user_id: Sequelize.STRING,
      file_url: Sequelize.STRING,
      file_size: Sequelize.INTEGER,
      file_type: Sequelize.STRING,
      file_name: Sequelize.STRING,
      file_metadata: Sequelize.TEXT,
      created_by: Sequelize.STRING,
      updated_by: Sequelize.STRING,
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    /**
     * 4. Join Tables / Junction Tables
     */

    // UserAccess (Schema: USR)
    await queryInterface.createTable(
      { tableName: "UserAccess", schema: "USR" },
      {
        industry_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: { tableName: "Industry", schema: "USR" },
            key: "industry_id",
          },
          onDelete: "CASCADE",
        },
        client_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: { tableName: "Client", schema: "USR" },
            key: "client_id",
          },
          onDelete: "CASCADE",
        },
        user_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: { tableName: "Users", schema: "USR" },
            key: "user_id",
          },
          onDelete: "CASCADE",
        },
        persona_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: { tableName: "Persona", schema: "USR" },
            key: "persona_id",
          },
          onDelete: "CASCADE",
        },
        data_source_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: { tableName: "DataSource", schema: "USR" },
            key: "data_source_id",
          },
          onDelete: "CASCADE",
        },
        created_at: Sequelize.DATE,
        updated_at: Sequelize.DATE,
      }
    );

    // HomeScreenPersonaRef (Schema: USR)
    await queryInterface.createTable(
      { tableName: "HomeScreenPersonaRef", schema: "USR" },
      {
        persona_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: { tableName: "Persona", schema: "USR" },
            key: "persona_id",
          },
        },
        visual_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: { tableName: "HomeScreen", schema: "USR" },
            key: "visual_id",
          },
        },
      }
    );

    // InsightsScreenPersonaRef (Schema: USR)
    await queryInterface.createTable(
      { tableName: "InsightsScreenPersonaRef", schema: "USR" },
      {
        persona_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: { tableName: "Persona", schema: "USR" },
            key: "persona_id",
          },
        },
        insight_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: { tableName: "InsightsScreen", schema: "USR" },
            key: "insight_id",
          },
        },
        created_at: Sequelize.DATE,
        updated_at: Sequelize.DATE,
      }
    );

    // PersonaKPIRef (Schema: USR)
    await queryInterface.createTable(
      { tableName: "PersonaKPIRef", schema: "USR" },
      {
        persona_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: { tableName: "Persona", schema: "USR" },
            key: "persona_id",
          },
        },
        kpi_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: { tableName: "KPIs", schema: "USR" },
            key: "kpi_id",
          },
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      }
    );
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order of dependency
    
    // Join Tables
    await queryInterface.dropTable({ tableName: "PersonaKPIRef", schema: "USR" });
    await queryInterface.dropTable({ tableName: "InsightsScreenPersonaRef", schema: "USR" });
    await queryInterface.dropTable({ tableName: "HomeScreenPersonaRef", schema: "USR" });
    await queryInterface.dropTable({ tableName: "UserAccess", schema: "USR" });
    
    // Public Tables with FKs
    await queryInterface.dropTable("Files");
    await queryInterface.dropTable("Messages");
    
    // Drop Enums after tables using them are gone
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Messages_sender_type";');

    // Other Tables
    await queryInterface.dropTable({ tableName: "tasks", schema: "RGM" });
    await queryInterface.dropTable({ tableName: "RecommendedQuestions", schema: "USR" });
    await queryInterface.dropTable({ tableName: "user_artifacts", schema: "DBO" });
    await queryInterface.dropTable({ tableName: "Conversations", schema: "DBO" });

    
    // Core Tables
    await queryInterface.dropTable({ tableName: "workflows", schema: "USR" });
    await queryInterface.dropTable({ tableName: "KPIs", schema: "USR" });
    await queryInterface.dropTable({ tableName: "InsightsScreen", schema: "USR" });
    await queryInterface.dropTable({ tableName: "HomeScreen", schema: "USR" });
    await queryInterface.dropTable({ tableName: "Persona", schema: "USR" });
    await queryInterface.dropTable({ tableName: "DataSource", schema: "USR" });
    await queryInterface.dropTable({ tableName: "Industry", schema: "USR" });
    await queryInterface.dropTable({ tableName: "Client", schema: "USR" });
    await queryInterface.dropTable({ tableName: "Users", schema: "USR" });

    // Drop Schemas
    await queryInterface.dropSchema("DBO");
    await queryInterface.dropSchema("RGM");
    await queryInterface.dropSchema("USR");
  },
};