const fs = require("fs");
const axios = require("axios");
const Youtube = require("youtube-api");
const { checkFileExists } = require("../utils/checkFileExists");
const { getVideoDescription } = require("./getVideoDescription");
const { getVideoTitle } = require("./getVideoTitle");
const { logger } = require("../../logger/logger");
const { updateLatestVideoURL } = require("../contentful/updateLatestVideoURL");
const { createInstagramPost } = require("./createInstagramPost");
require("dotenv").config();

const uploadToYouTubeOAuth = async (voxAccompanimentNames) => {
  let oauth = Youtube.authenticate({
    type: "oauth",
    client_id: process.env.YOUTUBE_CLIENT_ID,
    client_secret: process.env.YOUTUBE_CLIENT_SECRET,
    redirect_url: process.env.YOUTUBE_REDIRECT_URL,
  });

  try {
    // Need to get new access token (expires after 1 hour) from Google OAuth using refresh token
    const accessTokenObj = await axios.post(
      "https://www.googleapis.com/oauth2/v4/token",
      {
        refresh_token: process.env.YOUTUBE_API_REFRESH_TOKEN,
        client_id: process.env.YOUTUBE_CLIENT_ID,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET,
        grant_type: "refresh_token",
      }
    );

    const data = accessTokenObj.data;
    const accessToken = data.access_token;

    oauth.setCredentials({
      access_token: accessToken,
      refresh_token: process.env.YOUTUBE_API_REFRESH_TOKEN,
    });

    const videoTitle = await getVideoTitle();
    const videoDescription = await getVideoDescription();

    const videoExists = await checkFileExists("merged.mp4");
    const thumbnailExists = await checkFileExists("thumbnail.jpg");

    const loggerLog = (statement) => {
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
            loggerLog("Uploading video now...");

            Youtube.videos.insert(
              {
                resource: {
                  snippet: {
                    title: videoTitle,
                    description: videoDescription,
                    tags: [
                      "billboard",
                      "mashup",
                      "dj",
                      "mix",
                      "youtubemusic",
                      "music",
                      "newmusic",
                      "spotify",
                    ],
                    // Category ID for Music
                    categoryId: 10,
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
                    logger("server").error(
                      `Received an error when attempt to upload video to YouTube via videos.insert method: ${err}`
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
                  async (err, thumbRes) => {
                    if (err) {
                      const apiErrorStatement =
                        "The YouTube API returned an error when attempting to upload thumbnail: ";

                      if (process.env.NODE_ENV === "production") {
                        logger("server").error(`${apiErrorStatement}: ${err}`);
                      } else {
                        console.error(apiErrorStatement + err);
                      }

                      return;
                    }

                    loggerLog("Successfully uploaded thumbnail photo!");

                    const ytLink = "https://youtu.be/" + res.data.id;

                    await updateLatestVideoURL(ytLink, voxAccompanimentNames);

                    await createInstagramPost(videoTitle);
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
  } catch (e) {
    if (process.env.NODE_ENV === "production") {
      logger("server").error(
        `Received error when attempting to upload to YouTube: ${e}`
      );
    } else {
      console.error(e);
    }
  }
};

module.exports = { uploadToYouTubeOAuth };
