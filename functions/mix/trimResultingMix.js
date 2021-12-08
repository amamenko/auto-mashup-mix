const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const checkFileExists = require("../utils/checkFileExists");
const getClosestBeatArr = require("./getClosestBeatArr");

const trimResultingMix = async (instrumentals) => {
  const mp3Exists = await checkFileExists("original_mix.mp3");

  if (mp3Exists) {
    if (instrumentals) {
      const instrumentalSections = instrumentals.sections
        .map(getClosestBeatArr, instrumentals)
        .filter(
          (item) =>
            !item.sectionName.includes("intro") &&
            !item.sectionName.includes("outro")
        );

      const mixStart = instrumentalSections[0].start;
      const mixLastSection = instrumentalSections.find(
        (section) => section.start - mixStart >= 80
      );
      const mixEnd = mixLastSection
        ? mixLastSection.start
        : instrumentalSections[instrumentalSections.length - 1].start;

      const accompanimentModPath =
        "./functions/mix/inputs/accompaniment_mod.mp3";

      const allBeats = instrumentals.beats;
      const indexOfFirstBeat = allBeats.findIndex((beat) => beat === mixStart);
      const introStartBeat =
        indexOfFirstBeat >= 16
          ? allBeats[indexOfFirstBeat - 16]
          : indexOfFirstBeat;
      const introEndBeat =
        indexOfFirstBeat >= 16 ? mixStart : allBeats[indexOfFirstBeat + 16];

      const outroStartIndex = allBeats.findIndex((beat) => beat === mixEnd);
      const outroEnd = allBeats[outroStartIndex + 16]
        ? allBeats[outroStartIndex + 16]
        : allBeats[allBeats.length - 1];

      const start = Date.now();

      const introDuration = introEndBeat - introStartBeat;
      const mainMixDuration = mixEnd - mixStart;
      const outroDelay = (introDuration + mainMixDuration) * 1000;

      ffmpeg(accompanimentModPath)
        .input("original_mix.mp3")
        .input(accompanimentModPath)
        .output("./trimmed_mix.mp3")
        .complexFilter([
          // Trim and fade in intro instrumental
          {
            filter: `atrim=start=${introStartBeat}:end=${introEndBeat}`,
            inputs: "0:a",
            outputs: "intro_trim",
          },
          {
            filter: "asetpts=PTS-STARTPTS",
            inputs: "intro_trim",
            outputs: "intro_0",
          },
          {
            filter: "loudnorm=tp=-7:i=-28",
            inputs: "intro_0",
            outputs: "intro_norm",
          },
          // Bring down instrumental intro volume a little bit
          {
            filter: "volume=0.75",
            inputs: "intro_norm",
            outputs: "intro",
          },
          // Trim and delay main mix
          {
            filter: `atrim=start=${mixStart}:end=${mixEnd}`,
            inputs: "1:a",
            outputs: "main_trim",
          },
          {
            filter: "asetpts=PTS-STARTPTS",
            inputs: "main_trim",
            outputs: "main_0",
          },
          {
            filter: `adelay=${introDuration * 1000}|${introDuration * 1000}`,
            inputs: "main_0",
            outputs: "main_delay",
          },
          // Instrumental/vocal mix comes out quieter than original instrumental
          {
            filter: "volume=4",
            inputs: "main_delay",
            outputs: "main",
          },
          // Trim, fade out, and delay outro instrumental
          {
            filter: `atrim=start=${mixEnd}:end=${outroEnd}`,
            inputs: "2:a",
            outputs: "outro_trim",
          },
          {
            filter: "asetpts=PTS-STARTPTS",
            inputs: "outro_trim",
            outputs: "outro_0",
          },
          {
            filter: "loudnorm=tp=-7:i=-28",
            inputs: "outro_0",
            outputs: "outro_normalized",
          },
          {
            filter: "volume=2.5",
            inputs: "outro_normalized",
            outputs: "outro_volume",
          },
          {
            filter: `afade=t=out:st=0:d=${outroEnd - mixEnd}`,
            inputs: "outro_volume",
            outputs: "outro_fade",
          },
          {
            filter: `adelay=${outroDelay}|${outroDelay}`,
            inputs: "outro_fade",
            outputs: "outro_delay",
          },
          // Bring down instrumental outro volume a little bit
          {
            filter: "volume=0.75",
            inputs: "outro_delay",
            outputs: "outro",
          },
          // Merge all three sections together
          {
            filter: "amix=inputs=3",
            inputs: ["intro", "main", "outro"],
            outputs: "full_mix",
          },
          {
            filter: "loudnorm=tp=-7:i=-28",
            inputs: "full_mix",
            outputs: "full_mix_normalized",
          },
          {
            filter: `afade=t=in:st=0:d=${introDuration}`,
            inputs: "full_mix_normalized",
          },
        ])
        .on("error", async (err, stdout, stderr) => {
          console.log(
            `FFMPEG received an error. Terminating process. Output: ` +
              err.message
          );

          console.log("FFMPEG stdout:\n" + stdout);
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
        .on("progress", (progress) => {
          console.log(
            "Processing: " +
              (progress.percent ? progress.percent : "0") +
              "% done"
          );
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

module.exports = trimResultingMix;
