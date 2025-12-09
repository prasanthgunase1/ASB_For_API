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
  schema: "USR",
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
  Task: "RGM",
  DataSource: "USR",
  Client: "USR",
  UserAccess: "USR",
  Users: "USR",
  Industry: "USR",
  Persona: "USR",
  HomeScreen: "USR",
  HomeScreenPersonaRef: "USR",
  Conversation: "USR",
  Message: "USR",
  File: "USR",
  InsightsScreen: "USR",
  InsightsScreenPersonaRef: "USR",
  Workflow: "USR",
  KPI: "USR",
  PersonaKPIRef: "USR",
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
