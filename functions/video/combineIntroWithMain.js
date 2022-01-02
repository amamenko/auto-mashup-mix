const { exec } = require("child_process");
const { checkExistsAndDelete } = require("../utils/checkExistsAndDelete");

const combineIntroWithMain = () => {
  const reencodeIntro =
    "ffmpeg -i initial_intro.mp4 -vcodec libx264 -s 1920x1080 -r 60 -strict experimental intro.mp4";
  const reencodeMain =
    "ffmpeg -i initial_main.mp4 -vcodec libx264 -s 1920x1080 -r 60 -strict experimental main.mp4";
  const combineAudioWithMain =
    "ffmpeg -i main.mp4 -i full_mashup_mix.mp3 -c:v copy -c:a aac main_mix.mp4";
  const concatCommand =
    "ffmpeg -f concat -safe 0 -i inputs.txt -c copy merged.mp4";

  // In order for FFMPEG's concat method to work, both videos must be re-encoded to the same exact resolution and codec
  exec(reencodeIntro, async (err, stdout, stderr) => {
    if (err) {
      console.error(`exec error: ${err}`);
      return;
    } else {
      console.log("Successfully re-encoded intro.mp4!");

      await checkExistsAndDelete("initial_intro.mp4");

      const startReencode = Date.now();

      exec(reencodeMain, async (err, stdout, stderr) => {
        if (err) {
          console.error(`exec error: ${err}`);
          return;
        } else {
          console.log(
            `Successfully re-encoded main.mp4! The process took ${
              (Date.now() - startReencode) / 1000
            } seconds.`
          );

          await checkExistsAndDelete("initial_main.mp4");

          const startCombine = Date.now();

          exec(combineAudioWithMain, async (err, stdout, stderr) => {
            if (err) {
              console.error(`exec error: ${err}`);
              return;
            } else {
              console.log(
                `Successfully added audio to main mix slide show! The process took ${
                  (Date.now() - startCombine) / 1000
                } seconds.`
              );

              await checkExistsAndDelete("main.mp4");

              exec(concatCommand, async (err, stdout, stderr) => {
                if (err) {
                  console.error(`exec error: ${err}`);
                  return;
                } else {
                  console.log(
                    "Successfully concatenated intro and main mix videos!"
                  );

                  await checkExistsAndDelete("intro.mp4");
                  await checkExistsAndDelete("main_mix.mp4");
                  await checkExistsAndDelete("video_audio");
                  await checkExistsAndDelete("video_images");
                }
              });
            }
          });
        }
      });
    }
  });
};

module.exports = { combineIntroWithMain };
