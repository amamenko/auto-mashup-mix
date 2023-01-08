const wget = require("wget-improved");
const { logger } = require("../../logger/logger");
const { checkExistsAndDelete } = require("../utils/checkExistsAndDelete");
const spawnCommand = require("../utils/spawnCommand");
const { combineIntroWithMain } = require("./combineIntroWithMain");
require("dotenv").config();

const addGreenScreenBanners = async (thanksDelay, voxAccompanimentNames) => {
  const loggerLog = (statement) => {
    if (process.env.NODE_ENV === "production") {
      logger("server").info(statement);
    } else {
      console.log(statement);
    }
  };

  const download = wget.download(
    process.env.SUBSCRIBE_BUTTON_LINK,
    "initial_subscribe.mp4"
  );

  download.on("error", (err) => {
    if (process.env.NODE_ENV === "production") {
      logger("server").error(
        `Received error when attempting to download green screen 'Like and Subscribe' button video: ${err}`
      );
    } else {
      console.error(err);
    }

    return;
  });

  download.on("end", async () => {
    const doneStatement =
      "Done downloading green screen 'Like and Subscribe' button video!\nNow downloading green screen 'Thanks for Watching' video...";

    if (process.env.NODE_ENV === "production") {
      logger("server").info(doneStatement);
    } else {
      console.log(doneStatement);
    }

    const thanksDownload = wget.download(
      process.env.THANKS_FOR_WATCHING_LINK,
      "initial_thanks.mp4"
    );

    thanksDownload.on("error", (err) => {
      if (process.env.NODE_ENV === "production") {
        logger("server").error(
          `Received error when attempting to download green screen 'Thanks for Watching' banner video: ${err}`
        );
      } else {
        console.error(err);
      }

      return;
    });

    thanksDownload.on("end", async () => {
      const doneString =
        "Done downloading green screen 'Thanks for Watching' banner video!\nNow re-encoding green screen 'Like and Subscribe' video...";

      if (process.env.NODE_ENV === "production") {
        logger("server").info(doneString);
      } else {
        console.log(doneString);
      }

      const reencodeSubscribe =
        "-i initial_subscribe.mp4 -vcodec libx264 -s 1280x720 -r 60 -strict experimental subscribe.mp4";
      const reencodeThanks =
        "-i initial_thanks.mp4 -vcodec libx264 -s 1280x720 -r 60 -strict experimental thanks.mp4";
      const reencodeMain =
        "-i initial_main.mp4 -vcodec libx264 -s 1280x720 -r 60 -strict experimental initial_main_reencoded.mp4";
      const overlaySubscribe =
        "-i initial_main_reencoded.mp4 -itsoffset 3 -i subscribe.mp4 -filter_complex [1:v]colorkey=0x00FF00:0.4:0.0,despill=green=-1,boxblur=0:0:0:0:3:2[ckout];[ckout]setpts=PTS-STARTPTS+3/TB[v1];[0:v][v1]overlay[out] -map [out] main_sub.mp4";
      const overlayThanks = `-y -i main_sub.mp4 -i thanks.mp4 -filter_complex [1:v]colorkey=0x00FF00:0.4:0.0,despill=green=-1,boxblur=0:0:0:0:3:2[ckout];[ckout]setpts=PTS-STARTPTS+${thanksDelay}/TB[v1];[0:v][v1]overlay[out] -map [out] initial_main_green.mp4`;

      spawnCommand(
        "ffmpeg",
        reencodeSubscribe,
        // On error
        async () => {
          await checkExistsAndDelete("initial_subscribe.mp4");
        },
        // On finish
        async () => {
          loggerLog("Successfully re-encoded subscribe.mp4!");

          await checkExistsAndDelete("initial_subscribe.mp4");

          spawnCommand(
            "ffmpeg",
            reencodeThanks,
            async () => {
              await checkExistsAndDelete("initial_thanks.mp4");
            },
            async () => {
              loggerLog("Successfully re-encoded thanks.mp4!");

              await checkExistsAndDelete("initial_thanks.mp4");

              const startReencodeMain = Date.now();

              spawnCommand(
                "ffmpeg",
                reencodeMain,
                async () => {
                  await checkExistsAndDelete("initial_main.mp4");
                },
                async () => {
                  loggerLog(
                    `Successfully re-encoded initial_main_reencoded.mp4! The process took ${
                      (Date.now() - startReencodeMain) / 1000
                    } seconds.`
                  );

                  await checkExistsAndDelete("initial_main.mp4");

                  const startOverlay = Date.now();

                  spawnCommand(
                    "ffmpeg",
                    overlaySubscribe,
                    async () => {
                      await checkExistsAndDelete("subscribe.mp4");
                      await checkExistsAndDelete("initial_main_reencoded.mp4");
                    },
                    async () => {
                      loggerLog(
                        `Successfully overlayed green screen subscribe.mp4 onto the main mix! The process took ${
                          (Date.now() - startOverlay) / 1000
                        } seconds.`
                      );

                      await checkExistsAndDelete("subscribe.mp4");
                      await checkExistsAndDelete("initial_main_reencoded.mp4");

                      const startSecondOverlay = Date.now();

                      spawnCommand(
                        "ffmpeg",
                        overlayThanks,
                        async () => {
                          await checkExistsAndDelete("thanks.mp4");
                          await checkExistsAndDelete("main_sub.mp4");
                        },
                        async () => {
                          loggerLog(
                            `Successfully overlayed green screen thanks.mp4 onto the main mix! The process took ${
                              (Date.now() - startSecondOverlay) / 1000
                            } seconds.`
                          );

                          await checkExistsAndDelete("thanks.mp4");
                          await checkExistsAndDelete("main_sub.mp4");

                          combineIntroWithMain(voxAccompanimentNames);
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
};

module.exports = { addGreenScreenBanners };
