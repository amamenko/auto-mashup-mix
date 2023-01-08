const ffmpeg = require("fluent-ffmpeg");
const { checkFileExists } = require("../utils/checkFileExists");
const { getClosestBeatArr } = require("./getClosestBeatArr");
const { getAudioDurationInSeconds } = require("get-audio-duration");
const { addMixToContentful } = require("../contentful/addMixToContentful");
const { checkExistsAndDelete } = require("../utils/checkExistsAndDelete");
const { logger } = require("../../logger/logger");
require("dotenv").config();

const trimResultingMix = async (instrumentals, vocals) => {
  const mp3Exists = await checkFileExists("original_mix.mp3");

  if (mp3Exists) {
    if (instrumentals) {
      instrumentals.currentSection = "accompaniment";

      const instrumentalSections = instrumentals.sections
        .map(getClosestBeatArr, instrumentals)
        .filter(
          (item) =>
            !item.sectionName.includes("intro") &&
            !item.sectionName.includes("outro")
        );

      const mixStart = instrumentalSections[0].start;
      const mixLastSection = instrumentalSections.find(
        (section) => section.start - mixStart >= 75
      );
      const mixEnd = mixLastSection
        ? mixLastSection.start
        : instrumentalSections[instrumentalSections.length - 1].start;

      const accompanimentPath = "./functions/mix/inputs/accompaniment.mp3";

      const allBeats =
        typeof instrumentals.beats === "string"
          ? instrumentals.beats.split(", ")
          : instrumentals.beats;

      const indexOfFirstBeat = allBeats.findIndex((beat) => beat === mixStart);
      const introStartBeat =
        indexOfFirstBeat >= 16
          ? allBeats[indexOfFirstBeat - 16]
          : allBeats[indexOfFirstBeat];

      const outroStartIndex = allBeats.findIndex((beat) => beat === mixEnd);
      const outroEnd = allBeats[outroStartIndex + 16]
        ? allBeats[outroStartIndex + 16]
        : allBeats[allBeats.length - 1];

      const start = Date.now();

      const introDuration = mixStart - introStartBeat;
      const mainMixDuration = mixEnd - mixStart;
      const outroDelay = (introDuration + mainMixDuration) * 1000;

      ffmpeg("original_mix.mp3")
        .output("./trimmed_mix.mp3")
        .complexFilter([
          {
            filter: `atrim=start=${introStartBeat}:end=${outroEnd}`,
            inputs: "0:a",
            outputs: "main_trim",
          },
          {
            filter: "asetpts=PTS-STARTPTS",
            inputs: "main_trim",
            outputs: "main_0",
          },
          {
            filter: "volume=4",
            inputs: "main_0",
            outputs: "main",
          },
          {
            filter: `afade=t=out:st=${outroEnd - 10}:d=10`,
            inputs: "main",
            outputs: "main_fade_out",
          },
          {
            filter: "loudnorm=tp=-9:i=-33",
            inputs: "main_fade_out",
            outputs: "main_normalized",
          },
          {
            filter: `afade=t=in:st=0:d=${introDuration}`,
            inputs: "main_normalized",
          },
        ])
        .on("error", async (err, stdout, stderr) => {
          const errorMessageStatement = `FFMPEG received an error. Terminating process. Output: `;
          const stdErrStatement = "FFMPEG stderr:\n" + stderr;

          if (process.env.NODE_ENV === "production") {
            logger("server").error(`${errorMessageStatement}: ${err.message}`);
            logger("server").info(stdErrStatement);
          } else {
            console.error(`${errorMessageStatement} ${err.message}`);
            console.log(stdErrStatement);
          }

          await checkExistsAndDelete("./functions/mix/inputs");
          await checkExistsAndDelete("original_mix.mp3");
          await checkExistsAndDelete("trimmed_mix.mp3");

          return;
        })
        .on("end", async () => {
          const successStatement = `\nDone in ${
            (Date.now() - start) / 1000
          }s\nSuccessfully trimmed original MP3 file.\nSaved to trimmed_mix.mp3.`;

          if (process.env.NODE_ENV === "production") {
            logger("server").info(successStatement);
          } else {
            console.log(successStatement);
          }

          await checkExistsAndDelete("./functions/mix/inputs");
          await checkExistsAndDelete("original_mix.mp3");

          const mp3Duration = await getAudioDurationInSeconds(
            "trimmed_mix.mp3"
          ).catch((err) => {
            if (process.env.NODE_ENV === "production") {
              logger("server").error(
                `Received error when attempting to get audio duration of trimmed_mix.mp3 in seconds: ${err}`
              );
            } else {
              console.error(err);
            }
          });

          addMixToContentful(
            instrumentals,
            vocals,
            mp3Duration,
            introDuration,
            outroDelay / 1000
          );

          return;
        })
        .run();
    } else {
      const noSectionsAvailableStatement =
        "No instrumental sections available!";

      if (process.env.NODE_ENV === "production") {
        logger("server").info(noSectionsAvailableStatement);
      } else {
        console.log(noSectionsAvailableStatement);
      }

      return;
    }
  } else {
    const noFileAvailableStatement =
      "No original_mix.mp3 file available to trim!";

    if (process.env.NODE_ENV === "production") {
      logger("server").info(noFileAvailableStatement);
    } else {
      console.log(noFileAvailableStatement);
    }

    return;
  }
};

module.exports = { trimResultingMix };
