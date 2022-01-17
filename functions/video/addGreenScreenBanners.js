const wget = require("wget-improved");
const { exec } = require("child_process");
const { logger } = require("../logger/initializeLogger");
const { checkExistsAndDelete } = require("../utils/checkExistsAndDelete");
const { combineIntroWithMain } = require("./combineIntroWithMain");
require("dotenv").config();

const addGreenScreenBanners = async (thanksDelay) => {
  const loggerLog = (statement) => {
    if (process.env.NODE_ENV === "production") {
      logger.log(statement);
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
      logger.error(
        "Received error when attempting to download green screen 'Like and Subscribe' button video",
        {
          indexMeta: true,
          meta: {
            message: err,
          },
        }
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
      logger.log(doneStatement);
    } else {
      console.log(doneStatement);
    }

    const thanksDownload = wget.download(
      process.env.THANKS_FOR_WATCHING_LINK,
      "initial_thanks.mp4"
    );

    thanksDownload.on("error", (err) => {
      if (process.env.NODE_ENV === "production") {
        logger.error(
          "Received error when attempting to download green screen 'Thanks for Watching' banner video",
          {
            indexMeta: true,
            meta: {
              message: err,
            },
          }
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
        logger.log(doneString);
      } else {
        console.log(doneString);
      }

      const errorLog = (err) => {
        if (process.env.NODE_ENV === "production") {
          logger.error(
            "Received exec error when attempting to add green screen banners to main mix",
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

      const reencodeSubscribe =
        "ffmpeg -i initial_subscribe.mp4 -vcodec libx264 -s 1280x720 -r 60 -strict experimental subscribe.mp4";
      const reencodeThanks =
        "ffmpeg -i initial_thanks.mp4 -vcodec libx264 -s 1280x720 -r 60 -strict experimental thanks.mp4";
      const reencodeMain =
        "ffmpeg -i initial_main.mp4 -vcodec libx264 -s 1280x720 -r 60 -strict experimental initial_main_reencoded.mp4";
      const overlaySubscribe =
        "ffmpeg -i initial_main_reencoded.mp4 -itsoffset 3 -i subscribe.mp4 -filter_complex '[1:v]colorkey=0x00FF00:0.4:0.0,despill=green=-1,boxblur=0:0:0:0:3:2[ckout];[ckout]setpts=PTS-STARTPTS+3/TB[v1];[0:v][v1]overlay[out]' -map '[out]' main_sub.mp4";
      const overlayThanks = `ffmpeg -y -i main_sub.mp4 -i thanks.mp4 -filter_complex '[1:v]colorkey=0x00FF00:0.4:0.0,despill=green=-1,boxblur=0:0:0:0:3:2[ckout];[ckout]setpts=PTS-STARTPTS+${thanksDelay}/TB[v1];[0:v][v1]overlay[out]' -map '[out]' initial_main_green.mp4`;

      exec(reencodeSubscribe, async (err, stdout, stderr) => {
        if (err) {
          errorLog(err);

          await checkExistsAndDelete("initial_subscribe.mp4");

          return;
        } else {
          loggerLog("Successfully re-encoded subscribe.mp4!");

          await checkExistsAndDelete("initial_subscribe.mp4");

          exec(reencodeThanks, async (err, stdout, stderr) => {
            if (err) {
              errorLog(err);

              await checkExistsAndDelete("initial_thanks.mp4");

              return;
            } else {
              loggerLog("Successfully re-encoded thanks.mp4!");

              await checkExistsAndDelete("initial_thanks.mp4");

              const startReencodeMain = Date.now();

              exec(reencodeMain, async (err, stdout, stderr) => {
                if (err) {
                  errorLog(err);

                  await checkExistsAndDelete("initial_main.mp4");

                  return;
                } else {
                  loggerLog(
                    `Successfully re-encoded initial_main_reencoded.mp4! The process took ${
                      (Date.now() - startReencodeMain) / 1000
                    } seconds.`
                  );

                  await checkExistsAndDelete("initial_main.mp4");

                  const startOverlay = Date.now();

                  exec(overlaySubscribe, async (err, stdout, stderr) => {
                    if (err) {
                      errorLog(err);

                      await checkExistsAndDelete("subscribe.mp4");
                      await checkExistsAndDelete("initial_main_reencoded.mp4");

                      return;
                    } else {
                      loggerLog(
                        `Successfully overlayed green screen subscribe.mp4 onto the main mix! The process took ${
                          (Date.now() - startOverlay) / 1000
                        } seconds.`
                      );

                      await checkExistsAndDelete("subscribe.mp4");
                      await checkExistsAndDelete("initial_main_reencoded.mp4");

                      const startSecondOverlay = Date.now();

                      exec(overlayThanks, async (err, stdout, stderr) => {
                        if (err) {
                          errorLog(err);

                          await checkExistsAndDelete("thanks.mp4");
                          await checkExistsAndDelete("main_sub.mp4");

                          return;
                        } else {
                          loggerLog(
                            `Successfully overlayed green screen thanks.mp4 onto the main mix! The process took ${
                              (Date.now() - startSecondOverlay) / 1000
                            } seconds.`
                          );

                          await checkExistsAndDelete("thanks.mp4");
                          await checkExistsAndDelete("main_sub.mp4");

                          combineIntroWithMain();
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    });
  });
};

module.exports = { addGreenScreenBanners };
