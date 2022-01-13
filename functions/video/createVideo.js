const { createVideoThumbnail } = require("../images/createVideoThumbnail");
const { createMixOfAllMashups } = require("../mix/createMixOfAllMashups");
const { checkExistsAndDelete } = require("../utils/checkExistsAndDelete");
const { createSlideshow } = require("./createSlideshow");
const { getMashupImagesAndAudio } = require("./getMashupImagesAndAudio");
const { getMashupsForVideo } = require("./getMashupsForVideo");
const { logger } = require("../logger/initializeLogger");
require("dotenv").config();

const createVideo = async () => {
  const applicableMashups = await getMashupsForVideo();

  const allPromises = [];

  const loggerLog = (statement) => {
    if (process.env.NODE_ENV === "production") {
      logger.log(statement);
    } else {
      console.log(statement);
    }
  };

  loggerLog(
    "Got all applicable mashups for this week! Now getting applicable song profile images and mashup audio..."
  );

  for (let i = 0; i < applicableMashups.length; i++) {
    const currentPromise = getMashupImagesAndAudio(
      applicableMashups[i],
      i,
      applicableMashups.length - 1
    );
    allPromises.push(currentPromise);
  }

  Promise.all(allPromises.map((p) => p.catch((error) => null)))
    .then(async () => {
      loggerLog(
        "All mashup image/audio promises have been resolved! Creating video thumbnail photo now!"
      );
      await createVideoThumbnail().then(async () => {
        loggerLog(
          "Video thumbnail successfully created! Creating full mashup audio mix now!"
        );
        await checkExistsAndDelete("thumbnail_photos.txt");
        await createMixOfAllMashups().then(() => {
          loggerLog(
            "Full mashup audio mix successfully created! Creating slideshow video now!"
          );
          createSlideshow();
        });
      });
    })
    .catch(async (err) => {
      if (process.env.NODE_ENV === "production") {
        logger.error(
          `Received error when waiting for all promises related to getting applicable song profile images and mashup audio to succeed`,
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

      await checkExistsAndDelete("video_audio");
      await checkExistsAndDelete("video_images");
    });
};

module.exports = { createVideo };
