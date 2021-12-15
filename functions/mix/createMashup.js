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
            const otherChart = res.items.find(
              (item) => item.sys.id !== inProgressChart.sys.id
            );
            const currentIndex = inProgressChart.fields.currentLoopPosition
              ? inProgressChart.fields.currentLoopPosition
              : 0;
            const lastMashupListIndex =
              inProgressChart.fields.mashups.length - 1;
            const mashupListID = inProgressChart.sys.id;

            setTimeout(() => {
              if (currentIndex === 0) {
                addMashupPositionValue(mashupListID, currentIndex);
              }
            }, 90000);

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

            const currentSongs = res.items[0].fields.mashups[currentIndex];
            const currentIDs =
              currentSongs.accompanimentID + "," + currentSongs.vocalsID;

            await client
              .getEntries({
                "sys.id[in]": currentIDs,
                content_type: "song",
              })
              .then((songRes) => {
                if (songRes) {
                  if (songRes.items) {
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

                      normalizeInputsAndMix(
                        bothSections.accompaniment,
                        bothSections.vocals
                      );
                    }
                  }
                }
              });
          }
        }
      }
    });
};

module.exports = { createMashup };
