const db = require("./models");

exports.mapping = {
  // Existing mappings
  message: db["Message"],
  conversation: db["Conversation"],
  file: db["File"],
  homescreen: db["HomeScreen"],
  persona: db["Persona"],
  homescreenpersonaref: db["HomeScreenPersonaRef"],

  // Add new insights related mappings
  insightsscreen: db["InsightsScreen"],
  insightsscreenpersonaref: db["InsightsScreenPersonaRef"],

  // User related models
  users: db["Users"],
  useraccess: db["UserAccess"],

  // Business models
  client: db["Client"],
  industry: db["Industry"],
  datasource: db["DataSource"],

  // Task related models
  task: db["Task"],
  tasks: db["Task"],

  // Model name variations - for case insensitive lookup
  Users: db["Users"],
  UserAccess: db["UserAccess"],
  Client: db["Client"],
  Industry: db["Industry"],
  DataSource: db["DataSource"],
  Task: db["Task"],
  Tasks: db["Task"],
  Message: db["Message"],
  Conversation: db["Conversation"],
  File: db["File"],
  HomeScreen: db["HomeScreen"],
  Persona: db["Persona"],
  HomeScreenPersonaRef: db["HomeScreenPersonaRef"],
  InsightsScreen: db["InsightsScreen"],
  InsightsScreenPersonaRef: db["InsightsScreenPersonaRef"],
  workflow: db["Workflow"],
  kpi: db["KPI"],
  personakpiref: db["PersonaKPIRef"],
};
