const contentful = require("contentful");
const contentfulManagement = require("contentful-management");
const {
  cleanUpRemainingFilesAfterVideo,
} = require("../utils/cleanUpRemainingFilesAfterVideo");
const { getUniqueOnly } = require("../utils/getUniqueOnly");
const { findMatchingSongs } = require("./findMatchingSongs");
const { logger } = require("../../logger/logger");
require("dotenv").config();

const findMixable = async (applicableMode) => {
  // Access to Contentful Delivery API
  const client = contentful.createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
  });

  // Make sure no extraneous video files are left over
  cleanUpRemainingFilesAfterVideo();

  await client
    .getEntries({
      "fields.mode": applicableMode,
      select:
        "fields.title,fields.artist,fields.tempo,fields.key,fields.mode,fields.duration,fields.expectedSections,fields.sections,fields.cover,fields.charts,fields.beats,fields.accompaniment,fields.vocals",
      content_type: "song",
      limit: 1000,
    })
    .then(async (res) => {
      if (res) {
        if (res.items) {
          const matches = findMatchingSongs(res.items);

          const makeBeatArr = (str) => {
            return [...str.split(", ").map((item) => Number(item))];
          };

          let matchArr = matches.map((item) => {
            return {
              accompaniment: {
                ...item.accompaniment.fields,
                sections: item.accompaniment.sections,
                beats: makeBeatArr(item.accompaniment.fields.beats),
                keyScaleFactor: item.accompaniment.keyScaleFactor,
                tempoScaleFactor: item.accompaniment.tempoScaleFactor,
                id: item.accompaniment.sys.id,
              },
              vocals: {
                ...item.vocals.fields,
                beats: makeBeatArr(item.vocals.fields.beats),
                keyScaleFactor: item.vocals.keyScaleFactor,
                tempoScaleFactor: item.vocals.tempoScaleFactor,
                id: item.vocals.sys.id,
              },
            };
          });

          matchArr = getUniqueOnly(matchArr);

          if (matchArr && matchArr.length > 0) {
            const matchNames = [];

            for (let i = 0; i < matchArr.length; i++) {
              const currentAccompaniment = matchArr[i].accompaniment;
              const currentVocals = matchArr[i].vocals;

              matchNames.push({
                index: i,
                accompanimentTitle: currentAccompaniment.title,
                accompanimentArtist: currentAccompaniment.artist,
                accompanimentSections: currentAccompaniment.sections
                  .map((item) => item.sectionName)
                  .join(", "),
                accompanimentID: currentAccompaniment.id,
                vocalsTitle: currentVocals.title,
                vocalsArtist: currentVocals.artist,
                vocalsID: currentVocals.id,
                vocalsKeyScaleFactor: currentVocals.keyScaleFactor,
                vocalsTempoScaleFactor: currentVocals.tempoScaleFactor,
                mixed: false,
              });
            }

            const capitalizedMode =
              applicableMode.charAt(0).toUpperCase() + applicableMode.slice(1);

            await client
              .getEntries({
                "fields.title": `${capitalizedMode} Key Mashups`,
                content_type: "mixList",
              })
              .then(async (res) => {
                if (res) {
                  if (res.items) {
                    const mixListID = res.items[0].sys.id;

                    if (mixListID) {
                      // Access to Contentful Management API
                      const managementClient =
                        contentfulManagement.createClient({
                          accessToken: process.env.CONTENT_MANAGEMENT_TOKEN,
                        });

                      await managementClient
                        .getSpace(process.env.CONTENTFUL_SPACE_ID)
                        .then(async (space) => {
                          return await space
                            .getEnvironment("master")
                            .then(async (environment) => {
                              await environment
                                .getEntry(mixListID)
                                .then(async (entry) => {
                                  const trimmedArr = matchNames.slice(0, 2605);
                                  entry.fields.mashups = {
                                    "en-US": trimmedArr,
                                  };

                                  entry.fields.total = {
                                    "en-US": trimmedArr.length,
                                  };

                                  entry.fields.loopInProgress = {
                                    "en-US": false,
                                  };

                                  entry.fields.currentLoopPosition = {
                                    "en-US": 0,
                                  };

                                  return await entry.update().then(() => {
                                    environment
                                      .getEntry(mixListID)
                                      .then((updatedEntry) => {
                                        updatedEntry.publish().then(() => {
                                          const updatedMixListStatement = `${capitalizedMode} key mashups mix list has been updated! Total number of mixes: ${trimmedArr.length}`;

                                          if (
                                            process.env.NODE_ENV ===
                                            "production"
                                          ) {
                                            logger("server").info(
                                              updatedMixListStatement
                                            );
                                          } else {
                                            console.log(
                                              updatedMixListStatement
                                            );
                                          }
                                        });
                                      });
                                  });
                                });
                            });
                        });
                    }
                  }
                }
              });
          }
        }
      }
    })
    .catch((e) => console.error(e));
};

module.exports = { findMixable };
