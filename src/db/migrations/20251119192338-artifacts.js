"use strict";

/**
 * ============================================================
 * CONFIGURATION SECTION - EDIT HERE FOR FUTURE CHANGES
 * ============================================================
 */

const SCHEMAS = {
  app_non_prod: "app_non_prod",
  app_non_prod: "app_non_prod",
  app_non_prod: "app_non_prod", 
};

// CHANGED: All table names converted to snake_case
const TABLES = {
  // Independent Tables
  USERS: "users",                          // was "Users"
  CLIENT: "client",                        // was "Client"
  INDUSTRY: "industry",                    // was "Industry"
  DATA_SOURCE: "data_source",              // was "DataSource"
  PERSONA: "persona",                      // was "Persona"
  HOME_SCREEN: "home_screen",              // was "HomeScreen"
  INSIGHTS_SCREEN: "insights_screen",      // was "InsightsScreen"
  KPIS: "kpis",                            // was "KPIs"
  WORKFLOWS: "workflows",
  CONVERSATIONS: "conversations",          // was "Conversations"

  // Dependent Tables (FKs)
  USER_ARTIFACTS: "user_artifacts",
  RECOMMENDED_QUESTIONS: "recommended_questions", // was "RecommendedQuestions"
  TASKS: "tasks",
  MESSAGES: "message",                     // was "Message"
  FILES: "files",                          // was "Files"

  // Join/Junction Tables
  USER_ACCESS: "user_access",                       // was "UserAccess"
  HOME_SCREEN_PERSONA_REF: "home_screen_persona_ref",         // was "HomeScreenPersonaRef"
  INSIGHTS_SCREEN_PERSONA_REF: "insights_screen_persona_ref", // was "InsightsScreenPersonaRef"
  PERSONA_KPI_REF: "persona_kpi_ref",               // was "PersonaKPIRef"
};

/**
 * ============================================================
 * MIGRATION LOGIC
 * ============================================================
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * 1. Create Schemas
     */
    await queryInterface.createSchema(SCHEMAS.app_non_prod);
    await queryInterface.createSchema(SCHEMAS.app_non_prod);
    await queryInterface.createSchema(SCHEMAS.app_non_prod);

    /**
     * 2. Independent Tables
     */

    // users
    await queryInterface.createTable(
      { tableName: TABLES.USERS, schema: SCHEMAS.app_non_prod },
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

    // client
    await queryInterface.createTable(
      { tableName: TABLES.CLIENT, schema: SCHEMAS.app_non_prod },
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

    // industry
    await queryInterface.createTable(
      { tableName: TABLES.INDUSTRY, schema: SCHEMAS.app_non_prod },
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

    // data_source
    await queryInterface.createTable(
      { tableName: TABLES.DATA_SOURCE, schema: SCHEMAS.app_non_prod },
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

    // persona
    await queryInterface.createTable(
      { tableName: TABLES.PERSONA, schema: SCHEMAS.app_non_prod },
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
        home_exec_summary: Sequelize.JSONB,
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

    // home_screen
    await queryInterface.createTable(
      { tableName: TABLES.HOME_SCREEN, schema: SCHEMAS.app_non_prod },
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
        data_points: Sequelize.JSONB,
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

    // insights_screen
    await queryInterface.createTable(
      { tableName: TABLES.INSIGHTS_SCREEN, schema: SCHEMAS.app_non_prod },
      {
        insight_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        insight_title: Sequelize.STRING(255),
        insight_brief: Sequelize.TEXT,
        insight_faqs: Sequelize.JSONB,
        insight_anomaly_data_points: Sequelize.JSONB,
        sql_query: Sequelize.JSONB,
        data_points: Sequelize.JSONB,
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

    // kpis
    await queryInterface.createTable(
      { tableName: TABLES.KPIS, schema: SCHEMAS.app_non_prod },
      {
        kpi_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        kpi: Sequelize.STRING(255),
        key_action_levers: Sequelize.JSONB,
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

    // workflows
    await queryInterface.createTable(
      { tableName: TABLES.WORKFLOWS, schema: SCHEMAS.app_non_prod },
      {
        workflow_id: {
          type: Sequelize.STRING(100),
          allowNull: false,
          primaryKey: true,
        },
        workflow_name: Sequelize.STRING(255),
        created_by: Sequelize.STRING(255),
        timestamp: Sequelize.DATE,
        metadata: Sequelize.TEXT,
        workflow_steps: Sequelize.TEXT,
      }
    );

    // conversations
    await queryInterface.createTable(
      { tableName: TABLES.CONVERSATIONS, schema: SCHEMAS.app_non_prod },
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        user_id: Sequelize.STRING,
        title: Sequelize.STRING,
        conversation_metadata: Sequelize.JSONB,
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
      }
    );

    /**
     * 3. Tables with Foreign Keys
     */

    // user_artifacts
    await queryInterface.createTable(
      { tableName: TABLES.USER_ARTIFACTS, schema: SCHEMAS.app_non_prod },
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
              tableName: TABLES.PERSONA,
              schema: SCHEMAS.app_non_prod,
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
          type: Sequelize.JSONB,
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

    // recommended_questions
    await queryInterface.createTable(
      { tableName: TABLES.RECOMMENDED_QUESTIONS, schema: SCHEMAS.app_non_prod },
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

    // tasks
    await queryInterface.createTable(
      { tableName: TABLES.TASKS, schema: SCHEMAS.app_non_prod },
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

    // message
    await queryInterface.createTable(
      { tableName: TABLES.MESSAGES, schema: SCHEMAS.app_non_prod },
      {
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
              tableName: TABLES.CONVERSATIONS,
              schema: SCHEMAS.app_non_prod,
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
      }
    );

    // files
    await queryInterface.createTable(
      { tableName: TABLES.FILES, schema: SCHEMAS.app_non_prod },
      {
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
              tableName: TABLES.MESSAGES,
              schema: SCHEMAS.app_non_prod,
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
        file_metadata: Sequelize.JSONB,
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
      }
    );

    /**
     * 4. Join Tables
     */

    // user_access
    await queryInterface.createTable(
      { tableName: TABLES.USER_ACCESS, schema: SCHEMAS.app_non_prod },
      {
        industry_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: { tableName: TABLES.INDUSTRY, schema: SCHEMAS.app_non_prod },
            key: "industry_id",
          },
          onDelete: "CASCADE",
        },
        client_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: { tableName: TABLES.CLIENT, schema: SCHEMAS.app_non_prod },
            key: "client_id",
          },
          onDelete: "CASCADE",
        },
        user_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: { tableName: TABLES.USERS, schema: SCHEMAS.app_non_prod },
            key: "user_id",
          },
          onDelete: "CASCADE",
        },
        persona_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: { tableName: TABLES.PERSONA, schema: SCHEMAS.app_non_prod },
            key: "persona_id",
          },
          onDelete: "CASCADE",
        },
        data_source_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: { tableName: TABLES.DATA_SOURCE, schema: SCHEMAS.app_non_prod },
            key: "data_source_id",
          },
          onDelete: "CASCADE",
        },
        created_at: Sequelize.DATE,
        updated_at: Sequelize.DATE,
      }
    );

    // home_screen_persona_ref
    await queryInterface.createTable(
      { tableName: TABLES.HOME_SCREEN_PERSONA_REF, schema: SCHEMAS.app_non_prod },
      {
        persona_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: { tableName: TABLES.PERSONA, schema: SCHEMAS.app_non_prod },
            key: "persona_id",
          },
        },
        visual_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: { tableName: TABLES.HOME_SCREEN, schema: SCHEMAS.app_non_prod },
            key: "visual_id",
          },
        },
      }
    );

    // insights_screen_persona_ref
    await queryInterface.createTable(
      { tableName: TABLES.INSIGHTS_SCREEN_PERSONA_REF, schema: SCHEMAS.app_non_prod },
      {
        persona_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: { tableName: TABLES.PERSONA, schema: SCHEMAS.app_non_prod },
            key: "persona_id",
          },
        },
        insight_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: { tableName: TABLES.INSIGHTS_SCREEN, schema: SCHEMAS.app_non_prod },
            key: "insight_id",
          },
        },
        created_at: Sequelize.DATE,
        updated_at: Sequelize.DATE,
      }
    );

    // persona_kpi_ref
    await queryInterface.createTable(
      { tableName: TABLES.PERSONA_KPI_REF, schema: SCHEMAS.app_non_prod },
      {
        persona_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: { tableName: TABLES.PERSONA, schema: SCHEMAS.app_non_prod },
            key: "persona_id",
          },
        },
        kpi_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: { tableName: TABLES.KPIS, schema: SCHEMAS.app_non_prod },
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
    // Drop tables in reverse order

    // Join Tables
    await queryInterface.dropTable({ tableName: TABLES.PERSONA_KPI_REF, schema: SCHEMAS.app_non_prod });
    await queryInterface.dropTable({ tableName: TABLES.INSIGHTS_SCREEN_PERSONA_REF, schema: SCHEMAS.app_non_prod });
    await queryInterface.dropTable({ tableName: TABLES.HOME_SCREEN_PERSONA_REF, schema: SCHEMAS.app_non_prod });
    await queryInterface.dropTable({ tableName: TABLES.USER_ACCESS, schema: SCHEMAS.app_non_prod });

    // Public Tables with FKs
    await queryInterface.dropTable({ tableName: TABLES.FILES, schema: SCHEMAS.app_non_prod });
    await queryInterface.dropTable({ tableName: TABLES.MESSAGES, schema: SCHEMAS.app_non_prod });

    // Drop Enum (Dynamic name based on schema and table name)
    const enumName = `"enum_${SCHEMAS.app_non_prod}_${TABLES.MESSAGES}_sender_type"`; 
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS ${enumName};`);

    // Other Tables
    await queryInterface.dropTable({ tableName: TABLES.TASKS, schema: SCHEMAS.app_non_prod });
    await queryInterface.dropTable({ tableName: TABLES.RECOMMENDED_QUESTIONS, schema: SCHEMAS.app_non_prod });
    await queryInterface.dropTable({ tableName: TABLES.USER_ARTIFACTS, schema: SCHEMAS.app_non_prod });
    await queryInterface.dropTable({ tableName: TABLES.CONVERSATIONS, schema: SCHEMAS.app_non_prod });

    // Core Tables
    await queryInterface.dropTable({ tableName: TABLES.WORKFLOWS, schema: SCHEMAS.app_non_prod });
    await queryInterface.dropTable({ tableName: TABLES.KPIS, schema: SCHEMAS.app_non_prod });
    await queryInterface.dropTable({ tableName: TABLES.INSIGHTS_SCREEN, schema: SCHEMAS.app_non_prod });
    await queryInterface.dropTable({ tableName: TABLES.HOME_SCREEN, schema: SCHEMAS.app_non_prod });
    await queryInterface.dropTable({ tableName: TABLES.PERSONA, schema: SCHEMAS.app_non_prod });
    await queryInterface.dropTable({ tableName: TABLES.DATA_SOURCE, schema: SCHEMAS.app_non_prod });
    await queryInterface.dropTable({ tableName: TABLES.INDUSTRY, schema: SCHEMAS.app_non_prod });
    await queryInterface.dropTable({ tableName: TABLES.CLIENT, schema: SCHEMAS.app_non_prod });
    await queryInterface.dropTable({ tableName: TABLES.USERS, schema: SCHEMAS.app_non_prod });

    // Drop Schemas
    await queryInterface.dropSchema(SCHEMAS.app_non_prod);
    await queryInterface.dropSchema(SCHEMAS.app_non_prod);
    await queryInterface.dropSchema(SCHEMAS.app_non_prod);
  },
};