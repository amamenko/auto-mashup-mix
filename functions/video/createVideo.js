const fs = require("fs");
const { createVideoThumbnail } = require("../images/createVideoThumbnail");
const { createMixOfAllMashups } = require("../mix/createMixOfAllMashups");
const { checkExistsAndDelete } = require("../utils/checkExistsAndDelete");
const { createSlideshow } = require("./createSlideshow");
const { getMashupImagesAndAudio } = require("./getMashupImagesAndAudio");
const { getMashupsForVideo } = require("./getMashupsForVideo");
const { logger } = require("../../logger/logger");
require("dotenv").config();

const createVideo = async () => {
  const applicableMashups = await getMashupsForVideo();

  const voxAccompanimentNames = applicableMashups.map((mashup) => {
    return {
      vocalsTitle: mashup.fields.vocalsTitle,
      vocalsArtist: mashup.fields.vocalsArtist,
      accompanimentTitle: mashup.fields.accompanimentTitle,
      accompanimentArtist: mashup.fields.accompanimentArtist,
    };
  });

  const allPromises = [];

  const loggerLog = (statement) => {
    if (process.env.NODE_ENV === "production") {
      logger("server").info(statement);
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
      const filesArr = [];

      fs.readdirSync("./video_images").forEach((file) => {
        filesArr.push(file);
      });

      if (filesArr.length >= 14) {
        loggerLog(
          "All mashup image/audio promises have been resolved! Creating video thumbnail photo now!"
        );
        await createVideoThumbnail().then(async () => {
          loggerLog(
            "Video thumbnail successfully created! Creating full mashup audio mix now!"
          );
          await checkExistsAndDelete("thumbnail_photos.txt");
          await createMixOfAllMashups()
            .then(() => {
              loggerLog(
                "Full mashup audio mix successfully created! Creating slideshow video now!"
              );
              createSlideshow(voxAccompanimentNames);
            })
            .catch((err) => {
              if (process.env.NODE_ENV === "production") {
                logger("server").error(
                  `Received error when creating full mashup mix: ${err}`
                );
              } else {
                console.error(err);
              }
            });
        });
      } else {
        loggerLog(
          `Not enough video images were created! Only ${filesArr.length} were created successfully. Aborting video processes.`
        );
        await checkExistsAndDelete("video_audio");
        await checkExistsAndDelete("video_images");
        return;
      }
    })
    .catch(async (err) => {
      if (process.env.NODE_ENV === "production") {
        logger("server").error(
          `Received error when waiting for all promises related to getting applicable song profile images and mashup audio to succeed: ${err}`
        );
      } else {
        console.error(err);
      }

      await checkExistsAndDelete("video_audio");
      await checkExistsAndDelete("video_images");
    });
};

module.exports = { createVideo };
