const { checkExistsAndDelete } = require("../utils/checkExistsAndDelete");
const { exec } = require("child_process");
const { logger } = require("../logger/initializeLogger");
const { uploadToYouTubeOAuth } = require("./uploadToYouTubeOAuth");
require("dotenv").config();

const combineIntroWithMain = () => {
  const reencodeIntro =
    "ffmpeg -i initial_intro.mp4 -vcodec libx264 -s 1280x720 -r 60 -strict experimental intro.mp4";
  const reencodeMain =
    "ffmpeg -i initial_main.mp4 -vcodec libx264 -s 1280x720 -r 60 -strict experimental main.mp4";
  const combineAudioWithMain =
    "ffmpeg -i main.mp4 -i full_mashup_mix.mp3 -c:v copy -c:a aac main_mix.mp4";
  const concatCommand =
    "ffmpeg -f concat -safe 0 -i inputs.txt -c copy merged.mp4";

  const loggerLog = (statement) => {
    if (process.env.NODE_ENV === "production") {
      logger.log(statement);
    } else {
      console.log(statement);
    }
  };

  const errorLog = (err) => {
    if (process.env.NODE_ENV === "production") {
      logger.error(
        "Received exec error when attempting to combine intro with main mix slideshow video",
        {
          indexMeta: true,
          meta: {
            message: err,
          },
        }
      );
    } else {
      console.error(`exec error: ${err}`);
    }
  };

  // In order for FFMPEG's concat method to work, both videos must be re-encoded to the same exact resolution and codec
  exec(reencodeIntro, async (err, stdout, stderr) => {
    if (err) {
      errorLog(err);
      return;
    } else {
      loggerLog("Successfully re-encoded intro.mp4!");

      await checkExistsAndDelete("initial_intro.mp4");

      const startReencode = Date.now();

      exec(reencodeMain, async (err, stdout, stderr) => {
        if (err) {
          errorLog(err);
          return;
        } else {
          loggerLog(
            `Successfully re-encoded main.mp4! The process took ${
              (Date.now() - startReencode) / 1000
            } seconds.`
          );

          await checkExistsAndDelete("initial_main.mp4");

          const startCombine = Date.now();

          exec(combineAudioWithMain, async (err, stdout, stderr) => {
            if (err) {
              errorLog(err);
              return;
            } else {
              loggerLog(
                `Successfully added audio to main mix slide show! The process took ${
                  (Date.now() - startCombine) / 1000
                } seconds.`
              );

              await checkExistsAndDelete("main.mp4");

              exec(concatCommand, async (err, stdout, stderr) => {
                if (err) {
                  errorLog(err);
                  return;
                } else {
                  loggerLog(
                    "Successfully concatenated intro and main mix videos!"
                  );

                  await checkExistsAndDelete("intro.mp4");
                  await checkExistsAndDelete("main_mix.mp4");
                  await checkExistsAndDelete("video_audio");
                  await checkExistsAndDelete("video_images");
                  await checkExistsAndDelete("full_mashup_mix.mp3");

                  uploadToYouTubeOAuth();
                }
              });
            }
          });
        }
      });
    }
  });
};

module.exports = { combineIntroWithMain };
