const contentfulManagement = require("contentful-management");
const contentful = require("contentful");
const { delayExecution } = require("../utils/delayExecution");
const { logger } = require("../../logger/logger");
require("dotenv").config();

const updateActiveMixes = async (applicableMode) => {
  // Access to Contentful Delivery API
  const client = contentful.createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
  });

  const errorLog = (err) => {
    if (process.env.NODE_ENV === "production") {
      logger("server").error(
        `Received error when attempting to update active mixes: ${err}`
      );
    } else {
      console.error(err);
    }
  };

  return await client
    .getEntries({
      "fields.mode": applicableMode,
      select:
        "fields.title,fields.accompanimentTitle,fields.accompanimentArtist,fields.vocalsTitle,fields.vocalsArtist,fields.accompanimentSysId,fields.vocalsSysId,fields.mix",
      content_type: "mashup",
      limit: 1000,
    })
    .then(async (res) => {
      if (res) {
        if (res.items) {
          if (res.items.length > 0) {
            for (let i = 0; i < res.items.length; i++) {
              setTimeout(async () => {
                try {
                  const entryID = res.items[i].sys.id;
                  const mixID = res.items[i].fields.mix.sys.id;
                  const currentMashupTitle = res.items[i].fields.title;
                  const currentAccompanimentTitle =
                    res.items[i].fields.accompanimentTitle;
                  const currentAccompanimentArtist =
                    res.items[i].fields.accompanimentArtist;
                  const currentVocalsTitle = res.items[i].fields.vocalsTitle;
                  const currentVocalsArtist = res.items[i].fields.vocalsArtist;

                  const capitalizedMode =
                    applicableMode.charAt(0).toUpperCase() +
                    applicableMode.slice(1);

                  let currentMixList = await client.getEntries({
                    "fields.title": `${capitalizedMode} Key Mashups`,
                    content_type: "mixList",
                  });

                  const mashupListID = currentMixList.items[0].sys.id;
                  const allMashups = currentMixList.items[0].fields.mashups;

                  if (allMashups.length > 0) {
                    currentMixList = allMashups;

                    let foundMatchIndex = currentMixList.findIndex(
                      (item) =>
                        item.accompanimentTitle === currentAccompanimentTitle &&
                        item.accompanimentArtist ===
                          currentAccompanimentArtist &&
                        item.vocalsTitle === currentVocalsTitle &&
                        item.vocalsArtist === currentVocalsArtist
                    );

                    // Access to Contentful Management API
                    const managementClient = contentfulManagement.createClient({
                      accessToken: process.env.CONTENT_MANAGEMENT_TOKEN,
                    });

                    if (foundMatchIndex >= 0) {
                      managementClient
                        .getSpace(process.env.CONTENTFUL_SPACE_ID)
                        .then((space) => {
                          space.getEnvironment("master").then((environment) => {
                            environment
                              .getEntry(mashupListID)
                              .then((entry) => {
                                currentMixList[foundMatchIndex].mixed = true;

                                entry.fields.mashups = {
                                  "en-US": currentMixList,
                                };

                                entry
                                  .update()
                                  .then(() => {
                                    environment
                                      .getEntry(mashupListID)
                                      .then((updatedEntry) => {
                                        updatedEntry.publish();

                                        const updateSuccessStatement = `The associated mix list object for the mashup "${currentMashupTitle}" has been successfully updated to show that it was already mixed.`;

                                        if (
                                          process.env.NODE_ENV === "production"
                                        ) {
                                          logger("server").info(
                                            updateSuccessStatement
                                          );
                                        } else {
                                          console.log(updateSuccessStatement);
                                        }
                                      })
                                      .catch((e) => errorLog(e));
                                  })
                                  .catch((e) => errorLog(e));
                              })
                              .catch((e) => errorLog(e));
                          });
                        })
                        .catch((e) => errorLog(e));
                    } else {
                      managementClient
                        .getSpace(process.env.CONTENTFUL_SPACE_ID)
                        .then((space) => {
                          space.getEnvironment("master").then((environment) => {
                            environment
                              .getEntry(entryID)
                              .then((entry) => {
                                // Unpublish and delete entry itself
                                entry
                                  .unpublish()
                                  .then(async (unpublishedEntry) => {
                                    const deletingStatement = `Entry for mashup "${currentMashupTitle}" has been unpublished. Deleting now...`;

                                    if (process.env.NODE_ENV === "production") {
                                      logger("server").info(deletingStatement);
                                    } else {
                                      console.log(deletingStatement);
                                    }

                                    await delayExecution(1500);

                                    unpublishedEntry.delete();
                                  })
                                  .then(async () => {
                                    const deletedStatement = `Entry for mashup "${currentMashupTitle}" has been deleted.`;

                                    if (process.env.NODE_ENV === "production") {
                                      logger("server").info(deletedStatement);
                                    } else {
                                      console.log(deletedStatement);
                                    }

                                    await delayExecution(1500);

                                    // Delete mashup MP3 audio asset
                                    if (mixID) {
                                      environment
                                        .getAsset(mixID)
                                        .then((mixAsset) => {
                                          mixAsset
                                            .unpublish()
                                            .then(
                                              async (unpublishedMixAsset) => {
                                                const unpublishedStatement = `MP3 asset for mashup "${currentMashupTitle}" has been unpublished. Deleting now...`;

                                                if (
                                                  process.env.NODE_ENV ===
                                                  "production"
                                                ) {
                                                  logger("server").info(
                                                    unpublishedStatement
                                                  );
                                                } else {
                                                  console.log(
                                                    unpublishedStatement
                                                  );
                                                }

                                                await delayExecution(1500);

                                                unpublishedMixAsset.delete();
                                              }
                                            )
                                            .then(async () => {
                                              const deletedStatement = `MP3 asset for mashup "${currentMashupTitle}" has been deleted.`;

                                              if (
                                                process.env.NODE_ENV ===
                                                "production"
                                              ) {
                                                logger("server").info(
                                                  deletedStatement
                                                );
                                              } else {
                                                console.log(deletedStatement);
                                              }
                                            });
                                        });
                                    }
                                  })
                                  .catch((e) => errorLog(e));
                              })
                              .catch((e) => errorLog(e));
                          });
                        })
                        .catch((e) => errorLog(e));
                    }
                  }
                } catch (e) {
                  errorLog(e);
                }
              }, i * 10000);
            }
          }
        }
      }
    })
    .catch((e) => errorLog(e));
};

module.exports = { updateActiveMixes };
