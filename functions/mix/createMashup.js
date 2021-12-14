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
      "fields.loopInProgress": true,
      content_type: "mixList",
    })
    .then(async (res) => {
      if (res) {
        if (res.items && res.items[0]) {
          if (res.items[0].fields.mashups) {
            const currentIndex = res.items[0].fields.currentLoopPosition
              ? res.items[0].fields.currentLoopPosition
              : 0;
            const lastMashupListIndex = res.items[0].fields.mashups.length - 1;
            const mashupListID = res.items[0].sys.id;

            setTimeout(() => {
              if (currentIndex === 0) {
                addMashupPositionValue(mashupListID, currentIndex);
              }
            }, 90000);

            if (currentIndex === lastMashupListIndex) {
              updateMixLoopInProgress(mashupListID, "done");
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
