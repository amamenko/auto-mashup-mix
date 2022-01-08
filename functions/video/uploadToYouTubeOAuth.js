const Youtube = require("youtube-api");
const { checkFileExists } = require("../utils/checkFileExists");
const { getVideoDescription } = require("./getVideoDescription");
const { getVideoTitle } = require("./getVideoTitle");
const fs = require("fs");
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
  const thumbnailExists = await checkFileExists("thumbnail.png");

  if (videoExists) {
    if (thumbnailExists) {
      if (videoTitle) {
        if (videoDescription) {
          console.log("Uploading video now...");

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
                console.error(err);
              } else {
                console.log(
                  "Video has successfully been uploaded to YouTube! Uploading the thumbnail now."
                );
              }

              Youtube.thumbnails.set(
                {
                  videoId: res.data.id,
                  media: {
                    body: fs.createReadStream("thumbnail.png"),
                  },
                },
                (err, res) => {
                  if (err) {
                    console.log(
                      "The API returned an error when attempting to upload thumbnail: " +
                        err
                    );
                    return;
                  }

                  console.log("Successfully uploaded thumbnail photo!");
                }
              );
            }
          );
        } else {
          console.log("Video description does not exist. Can't upload video!");
          return;
        }
      } else {
        console.log("Video title does not exist. Can't upload video!");
        return;
      }
    } else {
      console.log("Thumbnail png file does not exist. Can't upload video!");
      return;
    }
  } else {
    console.log("Video mp4 file does not exist. Can't upload video!");
    return;
  }
};

module.exports = { uploadToYouTubeOAuth };
