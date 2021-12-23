const { default: axios } = require("axios");
const wget = require("wget-improved");
const { exec } = require("child_process");

const createSlideshow = () => {
  //   const download = wget.download(process.env.INTRO_VIDEO_LINK, "intro.mp4");

  //   download.on("error", (err) => {
  //     console.error(err);
  //     return;
  //   });

  //   download.on("end", async () => {
  //     console.log("Done downloading intro video!");

  exec(
    `ffmpeg -framerate 1 -i ./video_images/image_%d.png -c:v libx264 -r 29.97 -pix_fmt yuv420p output.mp4`,
    (err, stdout, stderr) => {
      if (err) {
        console.error(`exec error: ${err}`);
        return;
      } else {
        console.log("DONE");
      }
    }
  );
  //   });
};

module.exports = { createSlideshow };
