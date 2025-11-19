const { Sequelize } = require("sequelize");
const env = process.env.NODE_ENV || "development";
const config = require("./config.js")[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    logging: false,
    dialectOptions: {
      options: {
        requestTimeout: 300000, // 5 minutes
        connectTimeout: 60000, // 1 minute
        useUTC: false,
        encrypt: true,
      },
      connectTimeout: 60000,
    },
    pool: {
      max: 10,
      min: 2,
      acquire: 300000, // 5 minutes
      idle: 10000,
    },
  }
);

module.exports = sequelize;
