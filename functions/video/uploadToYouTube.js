const { upload } = require("youtube-videos-uploader");
const { checkFileExists } = require("../utils/checkFileExists");
const { getVideoDescription } = require("./getVideoDescription");
const { getVideoTitle } = require("./getVideoTitle");
const { logger } = require("../logger/initializeLogger");
const { createInstagramPost } = require("./createInstagramPost");
const {
  cleanUpRemainingFilesAfterVideo,
} = require("../utils/cleanUpRemainingFilesAfterVideo");
require("dotenv").config();

const uploadToYouTube = async () => {
  const credentials = {
    email: process.env.YOUTUBE_EMAIL,
    pass: process.env.YOUTUBE_PASSWORD,
    recoveryemail: process.env.YOUTUBE_RECOVERY_EMAIL,
  };

  const videoTitle = await getVideoTitle();
  const videoDescription = await getVideoDescription();

  const videoExists = await checkFileExists("merged.mp4");
  const thumbnailExists = await checkFileExists("thumbnail.png");

  const doesntExistStatementLog = (statement) => {
    if (process.env.NODE_ENV === "production") {
      logger.log(statement);
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
              logger.log(successStatement);
            } else {
              console.log(successStatement);
            }
          };

          const video = {
            path: "merged.mp4",
            title: videoTitle,
            description: videoDescription,
            thumbnail: "thumbnail.png",
            language: "english",
            onSuccess: onVideoUploadSuccess,
            skipProcessingWait: true,
          };

          try {
            await upload(credentials, [video], { args: ["--no-sandbox"] }).then(
              async (data) => {
                const ytLink = data[0];

                if (ytLink) {
                  await updateLatestVideoURL(ytLink);
                }

                await createInstagramPost(videoTitle);
              }
            );
          } catch (err) {
            if (process.env.NODE_ENV === "production") {
              logger.error(
                "Received error when attempting to upload to YouTube",
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
