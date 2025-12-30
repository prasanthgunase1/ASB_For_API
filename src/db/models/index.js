// // src/db/models/index.js
// "use strict";

// const fs = require("fs");
// const path = require("path");
// const { Sequelize, DataTypes } = require("sequelize"); // ✅ import Sequelize here

// const basename = path.basename(__filename);

// // Will be populated after initModels(sequelize) is called
// const db = {};

// /**
//  * Called once from src/config/database.js AFTER Sequelize is connected.
//  */
// function initModels(sequelize) {
//   // Load all model files in this folder (except index.js)
//   fs.readdirSync(__dirname)
//     .filter(
//       (file) =>
//         file.indexOf(".") !== 0 &&
//         file !== basename &&
//         file.slice(-3) === ".js"
//     )
//     .forEach((file) => {
//       const model = require(path.join(__dirname, file))(sequelize, DataTypes);
//       db[model.name] = model;
//     });

//   // Run associations
//   Object.keys(db).forEach((modelName) => {
//     try {
//       if (typeof db[modelName].associate === "function") {
//         db[modelName].associate(db);
//       }
//     } catch (error) {
//       console.error(`Error in ${modelName}.associate:`, error);
//     }
//   });

//   // Expose sequelize + Sequelize constructor (standard pattern)
//   db.sequelize = sequelize;
//   db.Sequelize = Sequelize;
// }

// module.exports = db;
// module.exports.initModels = initModels;


// NEW CODE
"use strict";
const fs = require("fs");
const path = require("path");
const { Sequelize, DataTypes } = require("sequelize"); 
const basename = path.basename(__filename);
const db = {};

function initModels(sequelize) {
  fs.readdirSync(__dirname)
    .filter((file) => file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js")
    .forEach((file) => {
      const model = require(path.join(__dirname, file))(sequelize, DataTypes);
      db[model.name] = model;
    });

  Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;
}

module.exports = db;
module.exports.initModels = initModels;