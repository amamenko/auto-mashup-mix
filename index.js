const express = require("express");
const app = express();
const {
  checkMashupLoopInProgress,
} = require("./functions/contentful/checkMashupLoopInProgress");
const { findMixable } = require("./functions/match/findMixable");
const { createMashup } = require("./functions/mix/createMashup");
const cron = require("node-cron");
const {
  updateActiveMixes,
} = require("./functions/contentful/updateActiveMixes");
const { format } = require("date-fns");
const { timeStampToSeconds } = require("./functions/utils/timeStampToSeconds");
const { isMashupTime } = require("./functions/utils/isMashupTime");
const { createVideo } = require("./functions/video/createVideo");
const Ffmpeg = require("fluent-ffmpeg");
const { createSlideshow } = require("./functions/video/createSlideshow");
require("dotenv").config();

const port = process.env.PORT || 4000;

// // Get all mixable mashups in major key
// // Runs at 1 AM on Sundays
// cron.schedule("0 1 * * 0", () => {
//   findMixable("major");
// });

// // Get all mixable mashups in minor key
// // Runs at 01:05 AM on Sundays
// cron.schedule("5 1 * * 0", () => {
//   findMixable("minor");
// });

// // CLEAN UP: Major key mashup mixes
// // Runs every 10 seconds on Sundays starting at 2 AM and ending at 5 AM
// cron.schedule("*/10 * 2-4 * * 0", () => {
//   const currentTime = format(new Date(), "HH:mm:ss");
//   const currentIndex =
//     (timeStampToSeconds(currentTime) - timeStampToSeconds("02:00:00")) / 10;
//   updateActiveMixes("major", currentIndex);
// });

// // CLEAN UP: Minor key mashup mixes
// // Runs every 10 seconds on Sundays starting at 5 AM and ending at 8 AM
// cron.schedule("*/10 * 5-7 * * 0", () => {
//   const currentTime = format(new Date(), "HH:mm:ss");
//   const currentIndex =
//     (timeStampToSeconds(currentTime) - timeStampToSeconds("05:00:00")) / 10;
//   updateActiveMixes("minor", currentIndex);
// });

// // Check for or update current mashup loop progression every 15 minutes from 8 AM Sunday to 12 PM Monday
// cron.schedule("*/15 * * * 0,1", () => {
//   if (isMashupTime()) {
//     checkMashupLoopInProgress();
//   }
// });

// // Loop next mashup position of current in-progress mix list (if any) every 2 minutes from 8 AM Sunday to 12 PM Monday
// cron.schedule("*/2 * * * 0,1", async () => {
//   if (isMashupTime()) {
//     createMashup();
//   }
// });

// createVideo();

// createSlideshow();

// cron.schedule("*/15 * * * *", () => {
//   checkMashupLoopInProgress();
// });

// cron.schedule("*/2 * * * *", () => {
//   createMashup();
// });

app.listen(port, () => console.log(`Listening on port ${port}...`));
