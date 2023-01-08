const winston = require("winston");
const { PapertrailTransport } = require("winston-papertrail-transport");
require("dotenv").config();

const hostname = "AutoMashupMix";
const container = new winston.Container();

const getConfig = (program) => {
  const transports = [];

  const papertrailTransport = new PapertrailTransport({
    host: process.env.PAPERTRAIL_HOST,
    port: process.env.PAPERTRAIL_PORT ? Number(process.env.PAPERTRAIL_PORT) : 0,
    hostname,
    program,
  });

  transports.push(papertrailTransport);

  return {
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ level, message }) => `${level} ${message}`)
    ),
    transports,
  };
};

const logger = (program) => {
  return container.add(program, getConfig(program));
};

module.exports = { logger };
