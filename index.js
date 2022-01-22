const express = require("express");
const app = express();
const cron = require("node-cron");
const { logger } = require("./functions/logger/initializeLogger");
const {
  checkMashupLoopInProgress,
} = require("./functions/contentful/checkMashupLoopInProgress");
const { findMixable } = require("./functions/match/findMixable");
const { createMashup } = require("./functions/mix/createMashup");
const {
  updateActiveMixes,
} = require("./functions/contentful/updateActiveMixes");
const { isMashupTime } = require("./functions/utils/isMashupTime");
const { createVideo } = require("./functions/video/createVideo");
const { onLoggerShutdown } = require("./functions/logger/onLoggerShutdown");
require("dotenv").config();

const port = process.env.PORT || 4000;

onLoggerShutdown();

// Get all mixable mashups in major key
// Runs at 1 AM on Sundays
cron.schedule("0 1 * * 0", () => {
  findMixable("major");
});

// Get all mixable mashups in minor key
// Runs at 01:05 AM on Sundays
cron.schedule("5 1 * * 0", () => {
  findMixable("minor");
});

// Cleans up major key mashups every 10 seconds on Sundays starting at 2 AM
cron.schedule("0 2 * * 0", () => {
  updateActiveMixes("major");
});

// Cleans up minor key mashups every 10 seconds on Sundays starting at 5 AM
cron.schedule("0 5 * * 0", () => {
  updateActiveMixes("minor");
});

// Check for or update current mashup loop progression every 15 minutes from 8 AM Sunday to 12 PM Monday
cron.schedule("*/15 * * * 0,1", () => {
  if (isMashupTime()) {
    checkMashupLoopInProgress();
  }
});

// Loop next mashup position of current in-progress mix list (if any) every 2 minutes from 8 AM Sunday to 12 PM Monday
cron.schedule("*/2 * * * 0,1", async () => {
  if (isMashupTime()) {
    createMashup();
  }
});

// Create and upload slideshow video to YouTube every Monday at noon
cron.schedule("0 12 * * 1", async () => {
  createVideo();
});

app.listen(port, () => {
  const portStatement = `Listening on port ${port}...`;

  if (process.env.NODE_ENV === "production") {
    logger.log(portStatement);
  } else {
    console.log(portStatement);
  }
});
