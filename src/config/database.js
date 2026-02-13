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

// POSTGRES NEW CODE 

// require("dotenv").config({ path: `${__dirname}/../../.env` });
// const { Sequelize } = require("sequelize");
// const { getDBSecrets } = require("./awsSecrets");
// const { logger } = require("../utils/logger");

// let sequelize;

// async function initSequelize() {
//   if (sequelize) return sequelize;

//   try {
//     logger.info("[database] Initializing connection...");
//     const secrets = await getDBSecrets();

//     sequelize = new Sequelize(secrets.dbname, secrets.username, secrets.password, {
//       host: secrets.host,
//       port: secrets.port || 5432,
//       dialect: "postgres",
//       logging: (msg) => logger.debug(msg),
//       pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
//       dialectOptions: {
//         statement_timeout: 30000,
//         ssl: { require: true, rejectUnauthorized: false },
//       },
//     });

//     await sequelize.authenticate();
//     logger.info("✅ Sequelize connected successfully!");

//     // Initialize Models
//     try {
//         const modelsModule = require("../db/models");
//         if (typeof modelsModule.initModels === "function") {
//             modelsModule.initModels(sequelize);
//             logger.info("[database] Models initialized.");
//         }
//     } catch (e) {
//         logger.warn(`[database] Model init skipped or failed: ${e.message}`);
//     }

//     return sequelize;
//   } catch (err) {
//     logger.error(`❌ Sequelize connection failed: ${err.message}`);
//     throw err;
//   }
// }

// function getSequelize() {
//   if (!sequelize) throw new Error("Sequelize instance requested before initialization.");
//   return sequelize;
// }

// module.exports = { initSequelize, getSequelize };


// SNOWFLAKE CODE
// src/db/database.js
require("dotenv").config({ path: `${__dirname}/../../.env` });
const snowflakeSdk = require("snowflake-sdk");
const { getSnowflakeSecret } = require("../awsSecrets.js");
const { logger } = require("../utils/logger.js");

let snowflakeConnection = null;

function cleanAccount(value) {
  return String(value || "").replace(".snowflakecomputing.com", "").trim();
}

async function getConfig() {
  const mode = process.env.SYSTEM_MODE; // "local" | "aws"

  if (mode === "aws") {
    const secretValue = await getSnowflakeSecret();
    console.log("AWS SECRETS", secretValue);

    // Keep exactly like your current approach (you had AWS fields commented).
    // If you want to enable aws fully, uncomment and map correctly.
    return {
      // username: secretValue.user || secretValue.username,
      // password: secretValue.password,
      // account: cleanAccount(secretValue.account),
      // database: secretValue.database || process.env.SNOWFLAKE_DATABASE,
      // schema: secretValue.schema || process.env.SNOWFLAKE_SCHEMA || "PUBLIC",
      // warehouse: secretValue.warehouse,
      // role: secretValue.role,
    };
  }

  // Local (your working flow)
  return {
    username: process.env.SYSTEM_USER,
    // password: process.env.SYSTEM_PASSWORD,
    account: cleanAccount(process.env.SYSTEM_ACCOUNT),
    database: process.env.SYSTEM_DATABASE,
    schema: process.env.SYSTEM_SCHEMA,
    // role: process.env.SYSTEM_ROLE,
    // warehouse: process.env.SYSTEM_WAREHOUSE,
    authenticator: process.env.SYSTEM_AUTHENTICATOR || "EXTERNALBROWSER",
  };
}

function executeQueryUsingConnection(activeConnection, sqlText, binds = []) {
  return new Promise((resolve, reject) => {
    activeConnection.execute({
      sqlText,
      binds,
      complete: (errorValue, _stmt, rows) => {
        if (errorValue) return reject(errorValue);
        resolve(rows || []);
      },
    });
  });
}

async function connectSnowflake() {
  // ✅ reuse existing connection
  if (snowflakeConnection) return snowflakeConnection;

  const config = await getConfig();

  console.log("Get Config:", {
    account: config.account,
    username: config.username,
    authenticator: config.authenticator,
  });

  snowflakeConnection = snowflakeSdk.createConnection({
    account: config.account,
    username: config.username,
    // password: config.password,
    database: config.database,
    // schema: config.schema,
    // warehouse: config.warehouse,
    authenticator: config.authenticator,
    // role: config.role,
    clientSessionKeepAlive: true,
  });

  await snowflakeConnection.connectAsync();
  console.log("✅ Snowflake Connected ✅");

  console.log(`USE DATABASE ${config.database}`);
  console.log(`USE SCHEMA ${config.schema}`);

  // ✅ Recommended: actually set DB/SCHEMA context (uncomment if needed)
  // if (config.database) await executeQueryUsingConnection(snowflakeConnection, `USE DATABASE ${config.database}`);
  // if (config.schema) await executeQueryUsingConnection(snowflakeConnection, `USE SCHEMA ${config.schema}`);

  logger?.info?.("✅ [Snowflake] Connected Successfully!");
  return snowflakeConnection;
}

async function runQuery(sqlText, binds = []) {
  if (!snowflakeConnection) {
    await connectSnowflake();
  }
  return executeQueryUsingConnection(snowflakeConnection, sqlText, binds);
}

async function closeSnowflake() {
  if (!snowflakeConnection) return;

  const connectionToClose = snowflakeConnection;
  snowflakeConnection = null;

  await new Promise((resolve) => {
    connectionToClose.destroy((errorValue) => {
      if (errorValue) {
        logger?.error?.("❌ Error closing Snowflake connection:", errorValue);
      } else {
        logger?.info?.("✅ Snowflake connection closed");
      }
      resolve();
    });
  });
}

module.exports = {
  connectSnowflake,
  runQuery,
  closeSnowflake,
};
