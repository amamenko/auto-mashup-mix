const { checkExistsAndDelete } = require("../utils/checkExistsAndDelete");
const { logger } = require("../../logger/logger");
const { uploadToYouTubeOAuth } = require("./uploadToYouTubeOAuth");
const spawnCommand = require("../utils/spawnCommand");
require("dotenv").config();

const combineIntroWithMain = (voxAccompanimentNames) => {
  // In order for FFMPEG's concat method to work, both videos must be re-encoded to the same exact resolution and codec
  const reencodeIntro =
    "-i initial_intro.mp4 -vcodec libx264 -s 1280x720 -r 60 -strict experimental intro.mp4";
  const reencodeMain =
    "-i initial_main_green.mp4 -vcodec libx264 -s 1280x720 -r 60 -strict experimental main.mp4";
  const combineAudioWithMain =
    "-i main.mp4 -i full_mashup_mix.mp3 -c:v copy -c:a aac main_mix.mp4";
  const concatCommand = "-f concat -safe 0 -i inputs.txt -c copy merged.mp4";

  const loggerLog = (statement) => {
    if (process.env.NODE_ENV === "production") {
      logger("server").info(statement);
    } else {
      console.log(statement);
    }
  };

  spawnCommand(
    "ffmpeg",
    reencodeIntro,
    // On error
    async () => {
      await checkExistsAndDelete("initial_intro.mp4");
    },
    // On finish
    async () => {
      loggerLog("Successfully re-encoded intro.mp4!");

      await checkExistsAndDelete("initial_intro.mp4");

      const startReencode = Date.now();

      spawnCommand(
        "ffmpeg",
        reencodeMain,
        async () => {
          await checkExistsAndDelete("initial_main_green.mp4");
        },
        async () => {
          loggerLog(
            `Successfully re-encoded main.mp4! The process took ${
              (Date.now() - startReencode) / 1000
            } seconds.`
          );

          await checkExistsAndDelete("initial_main_green.mp4");

          const startCombine = Date.now();

          spawnCommand(
            "ffmpeg",
            combineAudioWithMain,
            async () => {
              await checkExistsAndDelete("main.mp4");
            },
            async () => {
              loggerLog(
                `Successfully added audio to main mix slide show! The process took ${
                  (Date.now() - startCombine) / 1000
                } seconds.`
              );

              await checkExistsAndDelete("main.mp4");

              spawnCommand(
                "ffmpeg",
                concatCommand,
                async () => {
                  await checkExistsAndDelete("intro.mp4");
                  await checkExistsAndDelete("main_mix.mp4");
                  await checkExistsAndDelete("video_audio");
                  await checkExistsAndDelete("video_images");
                  await checkExistsAndDelete("full_mashup_mix.mp3");
                },
                async () => {
                  loggerLog(
                    "Successfully concatenated intro and main mix videos!"
                  );

                  await checkExistsAndDelete("intro.mp4");
                  await checkExistsAndDelete("main_mix.mp4");
                  await checkExistsAndDelete("video_audio");
                  await checkExistsAndDelete("video_images");
                  await checkExistsAndDelete("full_mashup_mix.mp3");

                  uploadToYouTubeOAuth(voxAccompanimentNames);
                }
              );
            }
          );
        }
      );
    }
  );
};

module.exports = { combineIntroWithMain };
