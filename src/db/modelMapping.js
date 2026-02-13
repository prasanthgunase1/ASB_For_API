// Define your Snowflake Schema here for easy updates
const SCHEMA = "SANDBOX_AI_BI.APP_SCHEMA";

exports.mapping = {
  // --- Core Chat Models ---
  // Note: Ensure these tables exist in Snowflake. 
  // If your chat history is stored in 'CHAT_AI_DOCS', update 'message' below.
  message: `${SCHEMA}.MESSAGE`,
  conversation: `${SCHEMA}.CONVERSATION`,
  file: `${SCHEMA}.FILE`,

  // --- Home Screen ---
  homescreen: `${SCHEMA}.HOME_SCREEN`,
  homescreenpersonaref: `${SCHEMA}.HOME_SCREEN_PERSONA_REF`,

  // --- Persona ---
  persona: `${SCHEMA}.PERSONA`,
  personakpiref: `${SCHEMA}.PERSONA_KPI_REF`,

  // --- Insights Screen ---
  insightsscreen: `${SCHEMA}.INSIGHTS_SCREEN`,
  insightsscreenpersonaref: `${SCHEMA}.INSIGHTS_SCREEN_PERSONA_REF`,

  // --- User Management ---
  users: `${SCHEMA}.USERS`,
  useraccess: `${SCHEMA}.USER_ACCESS`,

  // --- Business Entities ---
  client: `${SCHEMA}.CLIENT`,
  industry: `${SCHEMA}.INDUSTRY`,
  datasource: `${SCHEMA}.DATA_SOURCE`,

  // --- Workflow / Tasks ---
  task: `${SCHEMA}.TASK`,
  tasks: `${SCHEMA}.TASK`,
  workflow: `${SCHEMA}.WORKFLOW`,
  
  // --- KPI ---
  // Note: Check if your table is named 'KPI' or 'KPIS' based on your screenshot
  kpi: `${SCHEMA}.KPI`, 

  // --- Case Insensitive Lookups (Legacy Support) ---
  // These allow your existing controllers to find tables even if they capitalize keys differently
  Users: `${SCHEMA}.USERS`,
  UserAccess: `${SCHEMA}.USER_ACCESS`,
  Client: `${SCHEMA}.CLIENT`,
  Industry: `${SCHEMA}.INDUSTRY`,
  DataSource: `${SCHEMA}.DATA_SOURCE`,
  Task: `${SCHEMA}.TASK`,
  Tasks: `${SCHEMA}.TASK`,
  Message: `${SCHEMA}.MESSAGE`,
  Conversation: `${SCHEMA}.CONVERSATION`,
  File: `${SCHEMA}.FILE`,
  HomeScreen: `${SCHEMA}.HOME_SCREEN`,
  Persona: `${SCHEMA}.PERSONA`,
  HomeScreenPersonaRef: `${SCHEMA}.HOME_SCREEN_PERSONA_REF`,
  InsightsScreen: `${SCHEMA}.INSIGHTS_SCREEN`,
  InsightsScreenPersonaRef: `${SCHEMA}.INSIGHTS_SCREEN_PERSONA_REF`,
  PersonaKPIRef: `${SCHEMA}.PERSONA_KPI_REF`,
  KPI: `${SCHEMA}.KPI`
}; 