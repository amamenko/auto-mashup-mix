const { exec } = require("child_process");
const fs = require("fs");

const combineIntroWithMain = () => {
  const reencodeIntro = `ffmpeg -i initial_intro.mp4 -vcodec libx264 -s 1920x1080 -r 60 -strict experimental intro.mp4`;
  const reencodeMain = `ffmpeg -i initial_main.mp4 -vcodec libx264 -s 1920x1080 -r 60 -strict experimental main.mp4`;
  const concatCommand =
    "ffmpeg -f concat -safe 0 -i ./functions/video/inputs.txt -c copy merged.mp4";

  // In order for FFMPEG's concat method to work, both videos must be re-encoded to the same exact resolution and codec
  exec(reencodeIntro, (err, stdout, stderr) => {
    if (err) {
      console.error(`exec error: ${err}`);
      return;
    } else {
      console.log("Successfully re-encoded intro.mp4!");
      fs.rm("initial_intro.mp4");

      exec(reencodeMain, (err, stdout, stderr) => {
        if (err) {
          console.error(`exec error: ${err}`);
          return;
        } else {
          console.log("Successfully re-encoded output.mp4!");
          fs.rm("initial_output.mp4");

          exec(concatCommand, (err, stdout, stderr) => {
            if (err) {
              console.error(`exec error: ${err}`);
              return;
            } else {
              console.log(
                "Successfully concatenated intro and main mix videos!"
              );
            }
          });
        }
      });
    }
  });
};

module.exports = { combineIntroWithMain };
