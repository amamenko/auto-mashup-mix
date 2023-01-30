const contentful = require("contentful");
const { findMatchingSongs } = require("../match/findMatchingSongs");
const { normalizeInputsAndMix } = require("./normalizeInputsAndMix");
const { delayExecution } = require("../utils/delayExecution");
const { getUniqueOnly } = require("../utils/getUniqueOnly");
const {
  addMashupPositionValue,
} = require("../contentful/addMashupPositionValue");
const {
  updateMixLoopInProgress,
} = require("../contentful/updateMixLoopInProgress");
const { logger } = require("../../logger/logger");
const find = require("find-process");
require("dotenv").config();

const createMashup = async () => {
  const leftoverFfmpegProcesses = await find("name", "ffmpeg", true).then(
    (list) => list.length
  );
  // No hanging FFMPEG processes from previous mashup loop -> good to make new one
  if (!leftoverFfmpegProcesses) {
    // Access to Contentful Delivery API
    const client = contentful.createClient({
      space: process.env.CONTENTFUL_SPACE_ID,
      accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
    });

    const errorLog = (err) => {
      if (process.env.NODE_ENV === "production") {
        logger("server").error(
          `Received error when attempting to get individual song entries to create a new mashup entry: ${err}`
        );
      } else {
        console.error(err);
      }
    };

    await client
      .getEntries({
        content_type: "mixList",
      })
      .then(async (res) => {
        if (res) {
          if (res.items) {
            const inProgressChart = res.items.find(
              (item) => item.fields.loopInProgress === true
            );
            if (inProgressChart && inProgressChart.fields.mashups) {
              const notMixedYet = inProgressChart.fields.mashups.filter(
                (item) => !item.mixed
              );
              const otherChart = res.items.find(
                (item) => item.sys.id !== inProgressChart.sys.id
              );
              const currentIndex = inProgressChart.fields.currentLoopPosition
                ? inProgressChart.fields.currentLoopPosition
                : 0;
              const lastMashupListIndex = notMixedYet.length - 1;
              const mashupListID = inProgressChart.sys.id;
              setTimeout(() => {
                if (
                  currentIndex === 0 &&
                  currentIndex !== lastMashupListIndex
                ) {
                  addMashupPositionValue(mashupListID, currentIndex);
                }
              }, 10000);

              if (currentIndex === lastMashupListIndex) {
                await updateMixLoopInProgress(mashupListID, "done").then(
                  async () => {
                    // If major mix chart is done, move on to minor mixes
                    if (
                      inProgressChart.fields.title
                        .toLowerCase()
                        .includes("major")
                    ) {
                      if (otherChart) {
                        await updateMixLoopInProgress(
                          otherChart.sys.id,
                          "in progress"
                        );
                      }
                    }
                  }
                );
              } else {
                if (currentIndex !== 0) {
                  addMashupPositionValue(mashupListID, currentIndex);
                }
              }

              await delayExecution(1000);

              const currentSongs = notMixedYet[currentIndex];
              const currentIDs = currentSongs
                ? currentSongs.accompanimentID + "," + currentSongs.vocalsID
                : "";

              await client
                .getEntries({
                  "sys.id[in]": currentIDs,
                  content_type: "song",
                })
                .then(async (songRes) => {
                  if (songRes) {
                    if (songRes.items && songRes.items.length === 2) {
                      const matches = findMatchingSongs(songRes.items);
                      let filteredMatches = matches.filter(
                        (item) =>
                          item.accompaniment.sys.id ===
                            currentSongs.accompanimentID &&
                          item.vocals.sys.id === currentSongs.vocalsID
                      );

                      filteredMatches = getUniqueOnly(filteredMatches);

                      if (filteredMatches && filteredMatches[0]) {
                        const bothSections = filteredMatches[0];

                        const doesMashupAlreadyExist = await client
                          .getEntries({
                            "fields.vocalsTitle": currentSongs.vocalsTitle,
                            "fields.vocalsArtist": currentSongs.vocalsArtist,
                            "fields.accompanimentTitle":
                              currentSongs.accompanimentTitle,
                            "fields.accompanimentArtist":
                              currentSongs.accompanimentArtist,
                            content_type: "mashup",
                          })
                          .catch((e) => errorLog(e));

                        // Check for existing mashup just in case
                        if (
                          doesMashupAlreadyExist &&
                          doesMashupAlreadyExist.items.length === 0
                        ) {
                          const matchedAccompanimentSections =
                            currentSongs.accompanimentSections.split(", ");

                          bothSections.accompaniment.fields.id =
                            currentSongs.accompanimentID;
                          bothSections.accompaniment.fields.sections =
                            bothSections.accompaniment.fields.sections.filter(
                              (item) =>
                                matchedAccompanimentSections.includes(
                                  item.sectionName
                                )
                            );
                          bothSections.vocals.fields.id = currentSongs.vocalsID;
                          bothSections.vocals.fields.keyScaleFactor =
                            currentSongs.vocalsKeyScaleFactor;
                          bothSections.vocals.fields.tempoScaleFactor =
                            currentSongs.vocalsTempoScaleFactor;

                          normalizeInputsAndMix(
                            bothSections.accompaniment.fields,
                            bothSections.vocals.fields
                          );
                        } else {
                          const alreadyExistsStatement = `The mashup with accompaniment track "${currentSongs.accompanimentTitle}" by ${currentSongs.accompanimentArtist} mixed with the vocal track "${currentSongs.vocalsTitle}" by ${currentSongs.vocalsArtist} already exists! Moving on to next mashup.`;

                          if (process.env.NODE_ENV === "production") {
                            logger("server").info(alreadyExistsStatement);
                          } else {
                            console.log(alreadyExistsStatement);
                          }
                        }
                      }
                    } else {
                      const missingEntryStatement = `Can't find one or both song entries when trying to create a mashup with accompaniment track "${currentSongs.accompanimentTitle}" by ${currentSongs.accompanimentArtist} and vocal track "${currentSongs.vocalsTitle}" by ${currentSongs.vocalsArtist}. Moving on to next mashup.`;

                      if (process.env.NODE_ENV === "production") {
                        logger("server").info(missingEntryStatement);
                      } else {
                        console.log(missingEntryStatement);
                      }
                    }
                  }
                })
                .catch((e) => errorLog(e));
            }
          }
        }
      })
      .catch((e) => errorLog(e));
  } else {
    const hangingFfmpegStatement =
      "Hanging FFMPEG process is still in progress from previous mashup loop!";
    if (process.env.NODE_ENV === "production") {
      logger("server").info(hangingFfmpegStatement);
    } else {
      console.log(hangingFfmpegStatement);
    }
  }
};

module.exports = { createMashup };
