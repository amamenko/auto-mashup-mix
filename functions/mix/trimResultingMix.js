const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const { checkFileExists } = require("../utils/checkFileExists");
const { getClosestBeatArr } = require("./getClosestBeatArr");
const { getAudioDurationInSeconds } = require("get-audio-duration");
const { generateSongImage } = require("../images/generateSongImage");
const { addMixToContentful } = require("../contentful/addMixToContentful");

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
        indexOfFirstBeat >= 16 ? allBeats[indexOfFirstBeat - 16] : 0;

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
          console.log(
            `FFMPEG received an error. Terminating process. Output: ` +
              err.message
          );

          console.log("FFMPEG stderr:\n" + stderr);

          const inputsExists = await checkFileExists("./functions/mix/inputs");

          if (inputsExists) {
            fs.rmdirSync("./functions/mix/inputs", {
              recursive: true,
              force: true,
            });
            console.log("Audio MP3 inputs directory deleted!");
          }

          const originalOutputExists = await checkFileExists(
            "original_mix.mp3"
          );

          if (originalOutputExists) {
            fs.rm(
              "original_mix.mp3",
              {
                recursive: true,
                force: true,
              },
              () => console.log("Original original_mix.mp3 file deleted!")
            );
          }

          const leftoverOutputExists = await checkFileExists("trimmed_mix.mp3");

          if (leftoverOutputExists) {
            fs.rm(
              "trimmed_mix.mp3",
              {
                recursive: true,
                force: true,
              },
              () => console.log("Leftover trimmed_mix.mp3 file deleted!")
            );
          }

          return;
        })
        .on("end", async () => {
          console.log(
            `\nDone in ${
              (Date.now() - start) / 1000
            }s\nSuccessfully trimmed original MP3 file.\nSaved to trimmed_mix.mp3.`
          );

          const inputsExists = await checkFileExists("./functions/mix/inputs");

          if (inputsExists) {
            fs.rmdirSync("./functions/mix/inputs", {
              recursive: true,
              force: true,
            });
            console.log("Audio MP3 inputs directory deleted!");
          }

          const originalOutputExists = await checkFileExists(
            "original_mix.mp3"
          );

          if (originalOutputExists) {
            fs.rm(
              "original_mix.mp3",
              {
                recursive: true,
                force: true,
              },
              () => console.log("Original original_mix.mp3 file deleted!")
            );
          }

          const mp3Duration = await getAudioDurationInSeconds(
            "trimmed_mix.mp3"
          ).catch((e) => console.error(e));

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
      console.log("No instrumental sections available!");
      return;
    }
  } else {
    console.log("No original_mix.mp3 file available to trim!");
    return;
  }
};

module.exports = { trimResultingMix };
