const { upload } = require("youtube-videos-uploader");
const { checkFileExists } = require("../utils/checkFileExists");
const { getVideoDescription } = require("./getVideoDescription");
const { getVideoTitle } = require("./getVideoTitle");
const { logger } = require("../../logger/logger");
const {
  cleanUpRemainingFilesAfterVideo,
} = require("../utils/cleanUpRemainingFilesAfterVideo");
const { updateLatestVideoURL } = require("../contentful/updateLatestVideoURL");
const { createInstagramPost } = require("./createInstagramPost");
require("dotenv").config();

const uploadToYouTube = async (voxAccompanimentNames) => {
  const credentials = {
    email: process.env.YOUTUBE_EMAIL,
    pass: process.env.YOUTUBE_PASSWORD,
    recoveryemail: process.env.YOUTUBE_RECOVERY_EMAIL,
  };

  const videoTitle = await getVideoTitle();
  const videoDescription = await getVideoDescription();

  const videoExists = await checkFileExists("merged.mp4");
  const thumbnailExists = await checkFileExists("thumbnail.jpg");

  const doesntExistStatementLog = (statement) => {
    if (process.env.NODE_ENV === "production") {
      logger("server").info(statement);
    } else {
      console.log(statement);
    }
  };

  if (videoExists) {
    if (thumbnailExists) {
      if (videoTitle) {
        if (videoDescription) {
          const onVideoUploadSuccess = () => {
            const successStatement =
              "Successfully uploaded video and associated thumbnail photo!";

            if (process.env.NODE_ENV === "production") {
              logger("server").info(successStatement);
            } else {
              console.log(successStatement);
            }
          };

          const video = {
            path: "merged.mp4",
            title: videoTitle,
            description: videoDescription,
            thumbnail: "thumbnail.jpg",
            language: "english",
            onSuccess: onVideoUploadSuccess,
            skipProcessingWait: true,
          };

          try {
            await upload(credentials, [video], { args: ["--no-sandbox"] }).then(
              async (data) => {
                const ytLink = data[0];

                if (ytLink) {
                  await updateLatestVideoURL(ytLink, voxAccompanimentNames);
                }

                await createInstagramPost(videoTitle);
              }
            );
          } catch (err) {
            if (process.env.NODE_ENV === "production") {
              logger("server").error(
                `Received error when attempting to upload to YouTube: ${err}`
              );
            } else {
              console.error(err);
            }

            cleanUpRemainingFilesAfterVideo();
          }
        } else {
          doesntExistStatementLog(
            "Video description does not exist. Can't upload video!"
          );
          cleanUpRemainingFilesAfterVideo();
          return;
        }
      } else {
        doesntExistStatementLog(
          "Video title does not exist. Can't upload video!"
        );
        cleanUpRemainingFilesAfterVideo();
        return;
      }
    } else {
      doesntExistStatementLog(
        "Thumbnail png file does not exist. Can't upload video!"
      );
      cleanUpRemainingFilesAfterVideo();
      return;
    }
  } else {
    doesntExistStatementLog(
      "Video mp4 file does not exist. Can't upload video!"
    );
    cleanUpRemainingFilesAfterVideo();
    return;
  }
};

module.exports = { uploadToYouTube };
