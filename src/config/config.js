// src/config/config.js
require("dotenv").config({ path: `${__dirname}/../../.env` });

const NODE_ENV = process.env.NODE_ENV || "development";

// Base DB config
const baseDbConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT || "postgres",
  schema: "app_non_prod",
  define: {
    timestamps: true,
    underscored: true,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};


// For local 
const pyURL = process.env.LLM_ENDPOINT || "http://4.188.91.110:8443";

const endpoints = {
  chatAI: `${pyURL}/chat`,
  dataDictionary: `${pyURL}/data-dictionary-redis`,
  chatAIStatus: `${pyURL}/task-status`,
  chatAISelection: `${pyURL}/generate-document`,
  homeDashboardAPI: `${pyURL}/home_screen`,
  threadCreatingAPI: `${pyURL}/workflow/create`,
  threadReRunAPI: `${pyURL}/workflow/run`,
  dashboardsToPpt: `${pyURL}/dashboards_to_ppt`,
  insightsToPpt: `${pyURL}/insights_to_ppt`,
};

const allowedModels = {
  GET: [
    "conversation", "message", "homescreen", "persona", "homescreenpersonaref",
    "task", "tasks", "datasource", "client", "useraccess", "users",
    "industry", "workflow", "kpi",
  ],
  POST: [
    "conversation", "message", "file", "homescreen", "persona",
    "homescreenpersonaref", "task", "tasks", "datasource", "client",
    "useraccess", "users", "industry", "workflow", "kpi",
  ],
  PUT: [
    "conversation", "message", "homescreen", "persona", "homescreenpersonaref",
    "task", "tasks", "datasource", "client", "useraccess", "users",
    "industry", "workflow", "kpi",
  ],
  DELETE: [
    "conversation", "homescreen", "persona", "homescreenpersonaref",
    "task", "tasks", "datasource", "client", "useraccess", "users",
    "industry", "workflow", "kpi",
  ],
};

const modelMappings = {
  conversation: "Conversation",
  message: "Message",
  file: "File",
  homescreen: "HomeScreen",
  persona: "Persona",
  homescreenpersonaref: "HomeScreenPersonaRef",
  task: "Task",
  datasource: "DataSource",
  client: "Client",
  useraccess: "UserAccess",
  users: "Users",
  industry: "Industry",
  insightsscreen: "InsightsScreen",
  insightsscreenpersonaref: "InsightsScreenPersonaRef",
  workflow: "Workflow",
  kpi: "KPI",
  personakpiref: "PersonaKPIRef",
};

const schemaMapping = {
  // ✅ existing core models
  Task: "app_non_prod",
  DataSource: "app_non_prod",
  Client: "app_non_prod",
  UserAccess: "app_non_prod",
  Users: "app_non_prod",
  Industry: "app_non_prod",
  Persona: "app_non_prod",
  HomeScreen: "app_non_prod",
  HomeScreenPersonaRef: "app_non_prod",
  Conversation: "app_non_prod",
  Message: "app_non_prod",
  File: "app_non_prod",
  Insights: "app_non_prod",                 // insights.js
  InsightsScreen: "app_non_prod",
  InsightsScreenPersonaRef: "app_non_prod",
  Workflow: "app_non_prod",
  KPI: "app_non_prod",
  PersonaKPIRef: "app_non_prod",
  Artifacts: "app_non_prod",
  RecommendedQuestion: "app_non_prod",

  // ✅ new / ref models based on your 42 tables
  InsightsHlaRef: "app_non_prod",
  SqlTemplate: "app_non_prod",
  KpiRepository: "app_non_prod",
  KpiActivity: "app_non_prod",
  InsightsHlg: "app_non_prod",
  InsightsScreenKpiRef: "app_non_prod",
  PersonaBiDashboardRef: "app_non_prod",
  BiDashboard: "app_non_prod",
  KnownQuestion: "app_non_prod",
  KpiManagement: "app_non_prod",
  PersonaDocument: "app_non_prod",
  TableMetadata: "app_non_prod",
  AiForBiSummary: "app_non_prod",
  PersonaDbConnectionRef: "app_non_prod",
  InsightAnomaly: "app_non_prod",
  PersonaDocumentsRef: "app_non_prod",
  DashboardSummary: "app_non_prod",
  AiForBiUploadedDocument: "app_non_prod",
  KnownQuestionsPersonaRef: "app_non_prod",
  UserSqlQuery: "app_non_prod",
  KpiInfo: "app_non_prod",
  DbConnection: "app_non_prod",
  HomeScreenKpiRef: "app_non_prod",
};


const SAS_TOKEN_EXPIRY_HOURS = 10;

const redisConfig = {
  host: process.env.REDIS_HOST || "dt-tiger-dev.redis.cache.windows.net",
  port: parseInt(process.env.REDIS_PORT || "6380", 10),
  password: process.env.REDIS_PASSWORD,
  enableTLS: process.env.REDIS_SSL === "true",
  expireTime: parseInt(process.env.REDIS_EXPIRE || "14400", 10),
};

module.exports = {
  development: {
    ...baseDbConfig,
    dialectOptions: {
      statement_timeout: 30000,
    },
    logging: console.log,
  },

  test: {
    ...baseDbConfig,
    dialectOptions: {
      statement_timeout: 30000,
    },
    logging: false,
  },

  production: {
    ...baseDbConfig,
    dialectOptions: {
      statement_timeout: 30000,
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 60000,
      idle: 10000,
    },
  },

  allowedModels,
  modelMappings,
  schemaMapping,
  SAS_TOKEN_EXPIRY_HOURS,
  endpoints,
  redisConfig,
};
