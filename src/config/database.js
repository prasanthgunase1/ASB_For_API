const { Sequelize } = require("sequelize");
const env = process.env.NODE_ENV || "development";
const config = require("./config.js")[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: 'postgres',
    port: config.port || 5432,
    // logging: false,
    logging: console.log,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      statement_timeout: 30000,
      // 👇 THIS IS THE FIX: Enable SSL
      ssl: {
        require: true, 
        // This allows self-signed certs (common for cloud DBs like Azure/AWS/Render)
        rejectUnauthorized: false 
      }
    },
  }
);

module.exports = sequelize;



// src/config/database.js

// require("dotenv").config({ path: `${__dirname}/../../.env` });
// const { Sequelize } = require("sequelize");
// const { getDBSecrets } = require("./awsSecrets");

// let sequelize;

// /**
//  * Initialize Sequelize connection (RDS in prod via Secrets, config.js in dev).
//  */
// async function initSequelize() {
//   try {
//     const env = process.env.NODE_ENV || "development";
//     const isProduction = env === "production";

//     if (isProduction) {
//       // 🔐 PROD: use AWS Secrets Manager
//       const secrets = await getDBSecrets();

//       if (process.env.NODE_ENV !== "production") {
//         console.log(
//           "DB secrets loaded (keys only):",
//           Object.keys(secrets || {})
//         );
//       }

//       sequelize = new Sequelize(
//         secrets.dbname,
//         secrets.username,
//         secrets.password,
//         {
//           host: secrets.host,
//           dialect: "postgres",
//           port: secrets.port || 5432,
//           logging: false, // no noisy SQL in prod

//           pool: {
//             max: 10,
//             min: 0,
//             acquire: 30000,
//             idle: 10000,
//           },

//           dialectOptions: {
//             statement_timeout: 30000,
//             ssl: {
//               require: true,
//               // keep false for now, change to true once CA bundle is wired
//               rejectUnauthorized: false,
//             },
//           },
//         }
//       );
//     } else {
//       // 💻 DEV: use local config.js
//       const config = require("../db/config.js")[env]; // adjust path if needed

//       if (!config) {
//         throw new Error(`No DB config found for NODE_ENV="${env}" in config.js`);
//       }

//       sequelize = new Sequelize(
//         config.database,
//         config.username,
//         config.password,
//         {
//           host: config.host,
//           dialect: "postgres",
//           port: config.port || 5432,
//           logging: console.log, // see queries in dev

//           pool: {
//             max: 10,
//             min: 0,
//             acquire: 30000,
//             idle: 10000,
//           },

//           dialectOptions: {
//             statement_timeout: 30000,
//             // usually no SSL for local DB
//           },
//         }
//       );
//     }

//     await sequelize.authenticate();
//     console.log(`✅ Sequelize connected successfully (${env})`);

//     return sequelize;
//   } catch (err) {
//     console.error("❌ Sequelize connection failed:", err.message);
//     throw err;
//   }
// }

// /**
//  * Returns the initialized Sequelize instance.
//  */
// function getSequelize() {
//   if (!sequelize) {
//     throw new Error("Sequelize instance requested before initialization.");
//   }
//   return sequelize;
// }

// module.exports = { initSequelize, getSequelize };
