const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const { createComplexFilter } = require("./createComplexFilter");
const { checkFileExists } = require("../utils/checkFileExists");
const { trimResultingMix } = require("./trimResultingMix");
const { logger } = require("../../logger/logger");
require("dotenv").config();

const mixTracks = (instrumentals, vox, accompanimentPath, voxPath) => {
  const start = Date.now();

  const command = ffmpeg();

  const audioFiles = [
    accompanimentPath,
    ...Array(instrumentals.sections.length).fill(voxPath),
  ];

  audioFiles.forEach((fileName) => {
    command.input(fileName);
  });

  const fullComplexFilter = createComplexFilter(instrumentals, vox);

  if (fullComplexFilter && fullComplexFilter.length > 0) {
    command
      .complexFilter(fullComplexFilter)
      .output("./original_mix.mp3")
      .on("error", async (err, stdout, stderr) => {
        const errorMessageStatement = `FFMPEG received an error when attempting to mix the instrumentals of the track "${instrumentals.title}" by ${instrumentals.artist} with the vocals of the track "${vox.title}" by ${vox.artist}. Terminating process. Output: `;
        const stdErrStatement = "FFMPEG stderr:\n" + stderr;

        if (process.env.NODE_ENV === "production") {
          logger("server").error(`${errorMessageStatement}: ${err.message}`);
          logger("server").info(stdErrStatement);
        } else {
          console.error(`${errorMessageStatement} ${err.message}`);
          console.log(stdErrStatement);
        }

        const inputsExists = await checkFileExists("./functions/mix/inputs");
        const leftoverOutputExists = await checkFileExists("original_mix.mp3");

        if (inputsExists) {
          fs.rm(
            "./functions/mix/inputs",
            {
              recursive: true,
              force: true,
            },
            () => {
              const leftoverDeletedStatement =
                "Audio MP3 inputs directory deleted!";

              if (process.env.NODE_ENV === "production") {
                logger("server").info(leftoverDeletedStatement);
              } else {
                console.log(leftoverDeletedStatement);
              }
            }
          );
        }

        if (leftoverOutputExists) {
          fs.rm(
            "original_mix.mp3",
            {
              recursive: true,
              force: true,
            },
            () => {
              const leftoverDeletedStatement =
                "Leftover output MP3 file deleted!";

              if (process.env.NODE_ENV === "production") {
                logger("server").info(leftoverDeletedStatement);
              } else {
                console.log(leftoverDeletedStatement);
              }
            }
          );
        }

        return;
      })
      .on("end", async () => {
        const doneStatement = `\nDone in ${
          (Date.now() - start) / 1000
        }s\nSuccessfully mixed the instrumentals of the track "${
          instrumentals.title
        }" by ${instrumentals.artist} with the vocals of the track "${
          vox.title
        }" by ${vox.artist}.\nSaved to original_mix.mp3.`;

        if (process.env.NODE_ENV === "production") {
          logger("server").info(doneStatement);
        } else {
          console.log(doneStatement);
        }

        trimResultingMix(instrumentals, vox);

        return;
      })
      .run();
  } else {
    const noComplexFilterStatement = `No complex filter provided! Can't mix the instrumentals of the track "${instrumentals.title}" by ${instrumentals.artist} with the vocals of the track "${vox.title}" by ${vox.artist}. Moving on to next mix.`;

    if (process.env.NODE_ENV === "production") {
      logger("server").info(noComplexFilterStatement);
    } else {
      console.log(noComplexFilterStatement);
    }

    return;
  }
};

module.exports = { mixTracks };
