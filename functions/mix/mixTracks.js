const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const createComplexFilter = require("./createComplexFilter");
const checkFileExists = require("../utils/checkFileExists");
const trimResultingMix = require("./trimResultingMix");

const mixTracks = (instrumentals, vox, accompanimentModPath, voxModPath) => {
  const start = Date.now();

  const command = ffmpeg();

  const audioFiles = [
    accompanimentModPath,
    ...Array(instrumentals.sections.length).fill(voxModPath),
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
        console.log(
          `FFMPEG received an error when attempting to mix the instrumentals of the track "${instrumentals.title}" by ${instrumentals.artist} with the vocals of the track "${vox.title}" by ${vox.artist}. Terminating process. Output: ` +
            err.message
        );

        console.log("FFMPEG stdout:\n" + stdout);
        console.log("FFMPEG stderr:\n" + stderr);

        const inputsExists = await checkFileExists("./functions/mix/inputs");
        const leftoverOutputExists = await checkFileExists("original_mix.mp3");

        if (inputsExists) {
          fs.rm(
            "./functions/mix/inputs",
            {
              recursive: true,
              force: true,
            },
            () => console.log("Audio MP3 inputs directory deleted!")
          );
        }

        if (leftoverOutputExists) {
          fs.rm(
            "original_mix.mp3",
            {
              recursive: true,
              force: true,
            },
            () => console.log("Leftover output MP3 file deleted!")
          );
        }

        return;
      })
      .on("progress", (progress) => {
        console.log("Processing: " + progress.percent + "% done");
      })
      .on("end", async () => {
        console.log(
          `\nDone in ${
            (Date.now() - start) / 1000
          }s\nSuccessfully mixed the instrumentals of the track "${
            instrumentals.title
          }" by ${instrumentals.artist} with the vocals of the track "${
            vox.title
          }" by ${vox.artist}.\nSaved to original_mix.mp3.`
        );

        trimResultingMix(instrumentals);

        return;
      })
      .run();
  } else {
    console.log(
      `No complex filter provided! Can't mix the instrumentals of the track "${instrumentals.title}" by ${instrumentals.artist} with the vocals of the track "${vox.title}" by ${vox.artist}. Moving on to next mix.`
    );
    return;
  }
};

module.exports = mixTracks;
