const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const { PythonShell } = require("python-shell");
const mixTracks = require("./mixTracks");

const normalizeInputsAndMix = async (instrumentals, vocals) => {
  if (instrumentals && vocals) {
    const accompanimentLink = instrumentals.accompaniment.fields.file.url;
    const voxLink = vocals.vocals.fields.file.url;

    if (accompanimentLink && voxLink) {
      const accompanimentURL = "https:" + accompanimentLink;
      const voxURL = "https:" + voxLink;

      if (!fs.existsSync("./functions/mix/inputs")) {
        fs.mkdirSync("./functions/mix/inputs");
      }

      const start = Date.now();

      const accompanimentOriginalPath =
        "./functions/mix/inputs/accompaniment_original.mp3";
      const accompanimentModPath =
        "./functions/mix/inputs/accompaniment_mod.mp3";

      const voxOriginalPath = "./functions/mix/inputs/vox_original.mp3";
      const voxModPath = "./functions/mix/inputs/vox_mod.mp3";

      const streamArr = [
        {
          name: "accompaniment",
          url: accompanimentURL,
          path: accompanimentOriginalPath,
          mod_path: accompanimentModPath,
        },
        {
          name: "vox",
          url: voxURL,
          path: voxOriginalPath,
          mod_path: voxModPath,
        },
      ];

      for (const file of streamArr) {
        const writer = fs.createWriteStream(file.path);

        const response = await axios({
          url: file.url,
          method: "GET",
          responseType: "stream",
        });

        response.data.pipe(writer);

        response.data.on("error", (err) => {
          console.log(
            "Received an error when attempting to download YouTube video audio. Terminating process. Output: " +
              err
          );
          return;
        });

        response.data.on("end", () => {
          console.log(
            `\nDone in ${(Date.now() - start) / 1000}s\nSaved to ${file.path}.`
          );
        });
      }

      PythonShell.run(
        "./python_scripts/install_package.py",
        { args: ["rgain3"] },
        (err) => {
          if (err) {
            throw err;
          } else {
            console.log("Now batch normalizing audio files...");
            // Split audio into stems and clean up
            PythonShell.run(
              "./python_scripts/replaygain.py",
              {
                args: [accompanimentOriginalPath, voxOriginalPath],
              },
              (err, res) => {
                if (err) {
                  throw err;
                }

                const gainInfoIndex = res.findIndex((item) =>
                  item.includes("Calculating Replay Gain")
                );

                const fullAccompanimentRes =
                  res[gainInfoIndex + 1].split(".mp3:")[1];
                const fullVoxRes = res[gainInfoIndex + 2].split(".mp3:")[1];

                const accompanimentGainChange = fullAccompanimentRes
                  ? Number(
                      fullAccompanimentRes
                        .replace(" ", "")
                        .replace("dB", "")
                        .trim()
                    ) -
                    3 +
                    "dB"
                  : null;
                const voxGainChange = fullVoxRes
                  ? fullVoxRes.replace(" ", "")
                  : null;

                if (accompanimentGainChange && voxGainChange) {
                  for (let i = 0; i < streamArr.length; i++) {
                    const file = streamArr[i];

                    const accompanimentNum = Number(
                      accompanimentGainChange.replace("dB", "")
                    );
                    const voxNum = Number(voxGainChange.replace("dB", ""));

                    const newAccompanimentGainChange =
                      accompanimentNum * 10 + "dB";

                    if (fs.existsSync(file.path)) {
                      ffmpeg(file.path)
                        .audioFilters(
                          `volume=${
                            file.name === "accompaniment"
                              ? accompanimentNum > 0
                                ? newAccompanimentGainChange
                                : accompanimentGainChange
                              : voxNum + 30 + "dB"
                          }`
                        )
                        .output(file.mod_path)
                        .on("error", (err, stdout, stderr) => {
                          console.log(
                            `FFMPEG received an error when normalizing audio. Terminating process. Output: ` +
                              err.message
                          );
                          console.log("FFMPEG stderr:\n" + stderr);

                          fs.rmSync(accompanimentOriginalPath);
                          fs.rmSync(voxOriginalPath);
                          console.log(
                            "Original accompaniment and vocal MP3 files have been deleted!"
                          );
                          return;
                        })
                        .on("end", () => {
                          if (i === streamArr.length - 1) {
                            console.log(
                              `\nDone in ${
                                (Date.now() - start) / 1000
                              }s\nSuccessfully normalized both accompaniment (${newAccompanimentGainChange}) and vocal (${voxGainChange}) audio inputs.`
                            );

                            fs.rmSync(accompanimentOriginalPath);
                            fs.rmSync(voxOriginalPath);
                            console.log(
                              "Original accompaniment and vocal MP3 files have been deleted!"
                            );

                            mixTracks(
                              instrumentals,
                              vocals,
                              accompanimentModPath,
                              voxModPath
                            );
                          }
                        })
                        .run();
                    } else {
                      console.log(
                        `The file path "${file.path}" doesn't exist!`
                      );
                    }
                  }
                } else {
                  console.log(
                    "Unable to normalize audio inputs. Replay gain change information could not be determined."
                  );
                  return;
                }
              }
            );
          }
        }
      );
    } else {
      console.log(
        "Both the accompaniment track URL and the vocal track URL are required!"
      );
      return;
    }
  } else {
    console.log("Both the accompaniment track the vocal track are required!");
    return;
  }
};

module.exports = normalizeInputsAndMix;
