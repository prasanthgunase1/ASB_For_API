// // src/config/database.js

// require("dotenv").config({ path: `${__dirname}/../../.env` });
// const { Sequelize } = require("sequelize");
// const { getDBSecrets } = require("./awsSecrets");

// let sequelize;

// /**
//  * Initialize Sequelize using AWS Secrets Manager (only).
//  * Also initializes all models in src/db/models.
//  */
// async function initSequelize() {
//   try {
//     // If already initialized, just return existing instance
//     if (sequelize) {
//       return sequelize;
//     }

//     // 🔐 Always use AWS Secrets Manager for DB credentials
//     const secrets = await getDBSecrets(); // { username, password, host, port, dbname }



//     if (!secrets || !secrets.username || !secrets.password || !secrets.host) {
//       throw new Error(
//         "[database] Invalid DB secrets object from AWS Secrets Manager."
//       );
//     }

//     sequelize = new Sequelize(secrets.dbname, secrets.username, secrets.password, {
//       host: secrets.host,
//       dialect: "postgres",
//       port: secrets.port || 5432,
//       logging: false, // keep off in production

//       pool: {
//         max: 10,
//         min: 0,
//         acquire: 30000,
//         idle: 10000,
//       },

//       dialectOptions: {
//         statement_timeout: 30000,
//         ssl: {
//           require: true,
//           // keep false for now; set true later when CA bundle is in place
//           rejectUnauthorized: false,
//         },
//       },
//     });

//     await sequelize.authenticate();
//     console.log("✅ Sequelize connected successfully using AWS Secrets!");

//     // 🔁 Initialize all models with this Sequelize instance
//     const modelsModule = require("../db/models");
//     if (typeof modelsModule.initModels === "function") {
//       modelsModule.initModels(sequelize);
//     } else {
//       console.warn(
//         "[database] models.initModels not found – models may not be initialized correctly."
//       );
//     }

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

// NEW CODE 

require("dotenv").config({ path: `${__dirname}/../../.env` });
const { Sequelize } = require("sequelize");
const { getDBSecrets } = require("./awsSecrets");
const { logger } = require("../utils/logger");

let sequelize;

async function initSequelize() {
  if (sequelize) return sequelize;

  try {
    logger.info("[database] Initializing connection...");
    const secrets = await getDBSecrets();

    sequelize = new Sequelize(secrets.dbname, secrets.username, secrets.password, {
      host: secrets.host,
      port: secrets.port || 5432,
      dialect: "postgres",
      logging: (msg) => logger.debug(msg),
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      dialectOptions: {
        statement_timeout: 30000,
        ssl: { require: true, rejectUnauthorized: false },
      },
    });

    await sequelize.authenticate();
    logger.info("✅ Sequelize connected successfully!");

    // Initialize Models
    try {
        const modelsModule = require("../db/models");
        if (typeof modelsModule.initModels === "function") {
            modelsModule.initModels(sequelize);
            logger.info("[database] Models initialized.");
        }
    } catch (e) {
        logger.warn(`[database] Model init skipped or failed: ${e.message}`);
    }

    return sequelize;
  } catch (err) {
    logger.error(`❌ Sequelize connection failed: ${err.message}`);
    throw err;
  }
}

function getSequelize() {
  if (!sequelize) throw new Error("Sequelize instance requested before initialization.");
  return sequelize;
}

module.exports = { initSequelize, getSequelize };