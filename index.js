const express = require("express");
const app = express();
const {
  checkMashupLoopInProgress,
} = require("./functions/contentful/checkMashupLoopInProgress");
const { findMixable } = require("./functions/match/findMixable");
const { createMashup } = require("./functions/mix/createMashup");
const cron = require("node-cron");
require("dotenv").config();

const port = process.env.PORT || 4000;

// // Check for or update current mashup loop progression every 30 minutes
// cron.schedule("0,30 * * * *", () => {
//   checkMashupLoopInProgress();
// });

// // Loop next mashup position of current in-progress mix list (if any) every 2 minutes
// cron.schedule("*/2 * * * *", async () => {
//   createMashup();
// });

findMixable("major");

app.listen(port, () => console.log(`Listening on port ${port}...`));
