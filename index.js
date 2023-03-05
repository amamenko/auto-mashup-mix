const express = require("express");
const app = express();
const cron = require("node-cron");
const { logger } = require("./logger/logger");
const {
  checkMashupLoopInProgress,
} = require("./functions/contentful/checkMashupLoopInProgress");
const { findMixable } = require("./functions/match/findMixable");
const {
  updateActiveMixes,
} = require("./functions/contentful/updateActiveMixes");
const { createVideo } = require("./functions/video/createVideo");
const { delayExecution } = require("./functions/utils/delayExecution");
const { LambdaClient } = require("@aws-sdk/client-lambda");
const { triggerMashupLambda } = require("./functions/mix/triggerMashupLambda");
require("dotenv").config();

const port = process.env.PORT || 4000;

const lambdaClient = new LambdaClient({
  region: process.env.AWS_LAMBDA_REGION,
  credentials: {
    accessKeyId: process.env.AWS_LAMBDA_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_LAMBDA_SECRET_ACCESS_KEY,
  },
});

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

// Check for or update current mashup loop progression every 15 minutes from 8 AM Sunday to 12 AM Monday
cron.schedule("*/15 8-23 * * 0", () => {
  checkMashupLoopInProgress();
});

// Loop next mashup position of current in-progress mix list (if any) every 2 minutes from 8 AM Sunday to 12 AM Monday
cron.schedule("*/2 8-23 * * 0", async () => {
  triggerMashupLambda(lambdaClient);
});

// Restart server at 7 AM on Mondays
cron.schedule("0 7 * * 1", async () => {
  const restartingStatement = "Restarting server on purpose!";

  if (process.env.NODE_ENV === "production") {
    logger("server").info(restartingStatement);
  } else {
    console.log(restartingStatement);
  }

  await delayExecution(5000);

  process.exit(1);
});

// Create and upload slideshow video to YouTube every Monday beginning at 8 AM
cron.schedule("0 8 * * 1", async () => {
  createVideo();
});

app.listen(port, () => {
  const portStatement = `Listening on port ${port}...`;

  if (process.env.NODE_ENV === "production") {
    logger("server").info(portStatement);
  } else {
    console.log(portStatement);
  }
});
