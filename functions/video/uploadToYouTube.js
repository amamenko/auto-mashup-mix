const { upload } = require("youtube-videos-uploader");
const { checkFileExists } = require("../utils/checkFileExists");
const { getVideoDescription } = require("./getVideoDescription");
const { getVideoTitle } = require("./getVideoTitle");
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

  if (videoExists) {
    if (thumbnailExists) {
      if (videoTitle) {
        if (videoDescription) {
          const onVideoUploadSuccess = () =>
            console.log(
              "Successfully uploaded video and associated thumbnail photo!"
            );

          const video = {
            path: "merged.mp4",
            title: videoTitle,
            description: videoDescription,
            thumbnail: "thumbnail.png",
            language: "english",
            tags: [
              "mashup",
              "mash-up",
              "automated",
              "billboard",
              "music",
              "songs",
              "node.js",
              "contentful",
            ],
            onSuccess: onVideoUploadSuccess,
            skipProcessingWait: true,
          };

          try {
            await upload(credentials, [video]).then(console.log);
          } catch (e) {
            console.error(e);
          }
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

module.exports = { uploadToYouTube };
