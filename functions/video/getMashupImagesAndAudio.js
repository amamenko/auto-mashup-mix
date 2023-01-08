const fs = require("fs");
const wget = require("wget-improved");
const contentful = require("contentful");
const { generateSongImage } = require("../images/generateSongImage");
const { delayExecution } = require("../utils/delayExecution");
const { checkFileExists } = require("../utils/checkFileExists");
const { logger } = require("../../logger/logger");
require("dotenv").config();

const getMashupImagesAndAudio = async (currentMashup, i, lastIndex) => {
  // Access to Contentful Delivery API
  const client = contentful.createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
  });

  return new Promise(async (resolve, reject) => {
    const currentAccompanimentID = currentMashup.fields.accompanimentSysId;
    const currentVocalsID = currentMashup.fields.vocalsSysId;
    const currentIDs = currentAccompanimentID + "," + currentVocalsID;

    await delayExecution(i * 10000);

    await client
      .getEntries({
        "sys.id[in]": currentIDs,
        content_type: "song",
      })
      .then(async (songRes) => {
        if (songRes) {
          if (songRes.items && songRes.items.length === 2) {
            const accompanimentEntry = songRes.items.find(
              (item) => item.sys.id === currentAccompanimentID
            );
            const vocalsEntry = songRes.items.find(
              (item) => item.sys.id === currentVocalsID
            );

            if (accompanimentEntry && vocalsEntry) {
              const audioDirExists = await checkFileExists("./video_audio");

              if (!audioDirExists) {
                fs.mkdirSync("./video_audio");
              }

              const download = wget.download(
                "https:" + currentMashup.fields.mix.fields.file.url,
                `./video_audio/audio_${i}.mp3`
              );

              download.on("error", (err) => {
                if (process.env.NODE_ENV === "production") {
                  logger("server").error(
                    `Received error when attempting to download audio from ${
                      "https:" + currentMashup.fields.mix.fields.file.url
                    }: ${err}`
                  );
                } else {
                  console.error(err);
                }

                reject();
                return;
              });

              download.on("end", async () => {
                fs.writeFile(
                  "./video_audio/times.txt",
                  `audio_${i}\nduration: ${
                    currentMashup.fields.duration
                  }\nmixStart: ${currentMashup.fields.mixStart}\nmixEnd: ${
                    currentMashup.fields.mixEnd
                  }\n${currentMashup.fields.title.split("MASHUP - ")[1]}\n\n`,
                  { flag: "a" },
                  (err) => {
                    if (err) {
                      if (process.env.NODE_ENV === "production") {
                        logger("server").error(
                          `Received error when attempting to write to ./video_audio/times.txt: ${err}`
                        );
                      } else {
                        console.error(err);
                      }

                      reject();
                    }
                  }
                );

                fs.writeFile(
                  "allArtists.txt",
                  `${currentMashup.fields.accompanimentArtist}\n${currentMashup.fields.vocalsArtist}\n`,
                  { flag: "a" },
                  (err) => {
                    if (err) {
                      if (process.env.NODE_ENV === "production") {
                        logger("server").error(
                          `Received error when attempting to write to allArtists.txt: ${err}`
                        );
                      } else {
                        console.error(err);
                      }

                      reject();
                    }
                  }
                );

                let retries = 5;
                let success = false;

                while (retries !== 0 && !success) {
                  await generateSongImage(
                    accompanimentEntry.fields,
                    vocalsEntry.fields,
                    i
                  ).then(() => {
                    success = true;

                    const successStatement = `Successfully generated image ${
                      i + 1
                    } of ${lastIndex + 1} - ${currentMashup.fields.title}`;

                    if (process.env.NODE_ENV === "production") {
                      logger("server").info(successStatement);
                    } else {
                      console.log(successStatement);
                    }

                    resolve();
                  });
                }

                if (retries === 0) {
                  reject();
                }
              });
            } else {
              reject();
            }
          } else {
            reject();
          }
        } else {
          reject();
        }
      });
  });
};

module.exports = { getMashupImagesAndAudio };
