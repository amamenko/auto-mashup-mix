const { createLogger } = require("@logdna/logger");
require("dotenv").config();

const logger = createLogger(process.env.LOGGER_DNA_INGESTION_KEY, {
  app: process.env.LOGGER_DNA_APP_NAME,
  level: "debug",
});

module.exports = { logger };
