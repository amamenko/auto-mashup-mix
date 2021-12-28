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

const createMashup = async () => {
  // Access to Contentful Delivery API
  const client = contentful.createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
  });

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
              if (currentIndex === 0 && currentIndex !== lastMashupListIndex) {
                addMashupPositionValue(mashupListID, currentIndex);
              }
            }, 10000);

            if (currentIndex === lastMashupListIndex) {
              await updateMixLoopInProgress(mashupListID, "done").then(
                async () => {
                  // If major mix chart is done, move on to minor mixes
                  if (
                    inProgressChart.fields.title.toLowerCase().includes("major")
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
                          "fields.accompanimentSysId":
                            currentSongs.accompanimentID,
                          "fields.vocalsSysId": currentSongs.vocalsID,
                          select:
                            "fields.accompanimentSysId,fields.vocalsSysId",
                          content_type: "mashup",
                        })
                        .catch((e) => console.error(e));

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
                        console.log(
                          `The mashup with accompaniment track "${currentSongs.accompanimentTitle}" by ${currentSongs.accompanimentArtist} mixed with the vocal track "${currentSongs.vocalsTitle}" by ${currentSongs.vocalsArtist} already exists! Moving on to next mashup.`
                        );
                      }
                    }
                  } else {
                    console.log(
                      `Can't find one or both song entries when trying to create a mashup with accompaniment track "${currentSongs.accompanimentTitle}" by ${currentSongs.accompanimentArtist} and vocal track "${currentSongs.vocalsTitle}" by ${currentSongs.vocalsArtist}. Moving on to next mashup.`
                    );
                  }
                }
              })
              .catch((e) => console.error(e));
          }
        }
      }
    })
    .catch((e) => console.error(e));
};

module.exports = { createMashup };
