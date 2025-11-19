"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const sequelize = require("../../config/database"); // Use the centralized database instance
const basename = path.basename(__filename);
const db = {};

// Dynamically import models
fs.readdirSync(__dirname)
  .filter((file) => file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js")
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Apply associations
Object.keys(db).forEach((modelName) => {
  try {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  } catch (error) {
    console.error(`Error in ${modelName}: ${error}`);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
