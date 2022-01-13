const fs = require("fs");
const Youtube = require("youtube-api");
const { checkFileExists } = require("../utils/checkFileExists");
const { getVideoDescription } = require("./getVideoDescription");
const { getVideoTitle } = require("./getVideoTitle");
const { logger } = require("../logger/initializeLogger");
require("dotenv").config();

const uploadToYouTubeOAuth = async () => {
  let oauth = Youtube.authenticate({
    type: "oauth",
    client_id: process.env.YOUTUBE_CLIENT_ID,
    client_secret: process.env.YOUTUBE_CLIENT_SECRET,
    redirect_url: process.env.YOUTUBE_REDIRECT_URL,
  });

  oauth.setCredentials({
    access_token: process.env.YOUTUBE_API_ACCESS_TOKEN,
    refresh_token: process.env.YOUTUBE_API_REFRESH_TOKEN,
  });

  const videoTitle = await getVideoTitle();
  const videoDescription = await getVideoDescription();

  const videoExists = await checkFileExists("merged.mp4");
  const thumbnailExists = await checkFileExists("thumbnail.jpg");

  const loggerLog = (statement) => {
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
          loggerLog("Uploading video now...");

          Youtube.videos.insert(
            {
              resource: {
                snippet: {
                  title: videoTitle,
                  description: videoDescription,
                  defaultLanguage: "en",
                },
                status: {
                  privacyStatus: "public",
                },
              },
              part: "snippet,status",
              media: {
                body: fs.createReadStream("merged.mp4"),
              },
            },
            (err, res) => {
              if (err) {
                if (process.env.NODE_ENV === "production") {
                  logger.error(
                    "Received an error when attempt to upload video to YouTube via videos.insert method",
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
              } else {
                loggerLog(
                  "Video has successfully been uploaded to YouTube! Uploading the thumbnail now."
                );
              }

              Youtube.thumbnails.set(
                {
                  videoId: res.data.id,
                  media: {
                    body: fs.createReadStream("thumbnail.jpg"),
                  },
                },
                (err, res) => {
                  if (err) {
                    const apiErrorStatement =
                      "The API returned an error when attempting to upload thumbnail: ";

                    if (process.env.NODE_ENV === "production") {
                      logger.error(apiErrorStatement, {
                        indexMeta: true,
                        meta: {
                          message: err,
                        },
                      });
                    } else {
                      console.error(apiErrorStatement + err);
                    }

                    return;
                  }

                  loggerLog("Successfully uploaded thumbnail photo!");
                }
              );
            }
          );
        } else {
          loggerLog("Video description does not exist. Can't upload video!");
          return;
        }
      } else {
        loggerLog("Video title does not exist. Can't upload video!");
        return;
      }
    } else {
      loggerLog("Thumbnail png file does not exist. Can't upload video!");
      return;
    }
  } else {
    loggerLog("Video mp4 file does not exist. Can't upload video!");
    return;
  }
};

module.exports = { uploadToYouTubeOAuth };
