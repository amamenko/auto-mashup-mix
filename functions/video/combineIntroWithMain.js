const fs = require("fs");
const { exec } = require("child_process");
const { checkFileExists } = require("../utils/checkFileExists");

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

      const initialIntroExists = await checkFileExists("initial_intro.mp4");

      if (initialIntroExists) {
        fs.rm(
          "initial_intro.mp4",
          {
            recursive: true,
            force: true,
          },
          () => console.log("initial_intro.mp4 file deleted!")
        );
      }

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

          const initialMainExists = await checkFileExists("initial_main.mp4");

          if (initialMainExists) {
            fs.rm(
              "initial_main.mp4",
              {
                recursive: true,
                force: true,
              },
              () => console.log("initial_main.mp4 file deleted!")
            );
          }

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

              const mainExists = await checkFileExists("main.mp4");

              if (mainExists) {
                fs.rm(
                  "main.mp4",
                  {
                    recursive: true,
                    force: true,
                  },
                  () => console.log("main.mp4 file deleted!")
                );
              }

              exec(concatCommand, async (err, stdout, stderr) => {
                if (err) {
                  console.error(`exec error: ${err}`);
                  return;
                } else {
                  console.log(
                    "Successfully concatenated intro and main mix videos!"
                  );

                  const introExists = await checkFileExists("intro.mp4");

                  if (introExists) {
                    fs.rm(
                      "intro.mp4",
                      {
                        recursive: true,
                        force: true,
                      },
                      () => console.log("intro.mp4 file deleted!")
                    );
                  }

                  const mainMixExists = await checkFileExists("main_mix.mp4");

                  if (mainMixExists) {
                    fs.rm(
                      "main_mix.mp4",
                      {
                        recursive: true,
                        force: true,
                      },
                      () => console.log("main_mix.mp4 file deleted!")
                    );
                  }
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
