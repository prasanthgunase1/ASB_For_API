// src/config/config.js
require("dotenv").config({ path: `${__dirname}/../../.env` });

const NODE_ENV = process.env.NODE_ENV || "development";

// LLM / Python Service URLs
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

// Whitelist for Generic CRUD Controller
// These keys must match the keys exported in 'db/modelMapping.js'
const allowedModels = {
  GET: [
    "conversation", "message", "file", 
    "homescreen", "homescreenpersonaref", "homescreenkpiref",
    "persona", "personakpiref", "personadocuments", "personadocumentsref",
    "insightsscreen", "insightsscreenpersonaref", "insightshlq", "insightshlqref",
    "task", "tasks", "workflow",
    "users", "useraccess", 
    "client", "industry", "datasource",
    "kpi", "kpiactivity", "kpirepository",
    "recommendedquestions"
  ],
  POST: [
    "conversation", "message", "file", 
    "homescreen", "homescreenpersonaref",
    "persona", "personakpiref", "personadocuments",
    "insightsscreen", "insightsscreenpersonaref", "insightshlq",
    "task", "tasks", "workflow",
    "users", "useraccess", 
    "client", "industry", "datasource",
    "kpi", "kpiactivity"
  ],
  PUT: [
    "conversation", "message", 
    "homescreen", 
    "persona", 
    "insightsscreen",
    "task", "tasks", "workflow",
    "users", "useraccess",
    "kpi"
  ],
  DELETE: [
    "conversation", "message",
    "homescreen", "homescreenpersonaref",
    "persona", "personakpiref",
    "insightsscreen", "insightsscreenpersonaref",
    "task", "tasks", "workflow",
    "users", "useraccess",
    "kpi"
  ],
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
  allowedModels,
  SAS_TOKEN_EXPIRY_HOURS,
  endpoints,
  redisConfig,
  NODE_ENV
};