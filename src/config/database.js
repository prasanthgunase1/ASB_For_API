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