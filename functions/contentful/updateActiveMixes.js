const contentfulManagement = require("contentful-management");
const contentful = require("contentful");
const { delayExecution } = require("../utils/delayExecution");
const { logger } = require("../logger/initializeLogger");
require("dotenv").config();

const updateActiveMixes = async (applicableMode, currentIndex) => {
  // Access to Contentful Delivery API
  const client = contentful.createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
  });

  return await client
    .getEntries({
      "fields.mode": applicableMode,
      select:
        "fields.title,fields.accompanimentSysId,fields.vocalsSysId,fields.mix",
      content_type: "mashup",
      limit: 1000,
    })
    .then(async (res) => {
      if (res) {
        if (res.items) {
          if (res.items.length > 0) {
            if (res.items[currentIndex]) {
              const entryID = res.items[currentIndex].sys.id;
              const mixID = res.items[currentIndex].fields.mix.sys.id;
              const currentMashupTitle = res.items[currentIndex].fields.title;
              const currentAccompanimentID =
                res.items[currentIndex].fields.accompanimentSysId;
              const currentVocalsID =
                res.items[currentIndex].fields.vocalsSysId;

              const capitalizedMode =
                applicableMode.charAt(0).toUpperCase() +
                applicableMode.slice(1);

              let currentMixList = await client.getEntries({
                "fields.title": `${capitalizedMode} Key Mashups`,
                content_type: "mixList",
              });

              if (currentMixList[0]) {
                currentMixList = currentMixList[0];

                let foundMatchIndex = currentMixList.fields.mashups.findIndex(
                  (item) =>
                    item.accompanimentID === currentAccompanimentID &&
                    item.vocalsID === currentVocalsID
                );

                // Access to Contentful Management API
                const managementClient = contentfulManagement.createClient({
                  accessToken: process.env.CONTENT_MANAGEMENT_TOKEN,
                });

                if (foundMatchIndex > -1) {
                  const allMashupsList = currentMixList.fields.mashups;

                  managementClient
                    .getSpace(process.env.CONTENTFUL_SPACE_ID)
                    .then((space) => {
                      space.getEnvironment("master").then((environment) => {
                        environment.getEntry(entryID).then((entry) => {
                          allMashupsList[foundMatchIndex].mixed = true;

                          entry.fields.mashups = {
                            "en-US": allMashupsList,
                          };

                          entry.update().then(() => {
                            environment
                              .getEntry(entryID)
                              .then((updatedEntry) => {
                                updatedEntry.publish();

                                const updateSuccessStatement = `The associated mix list object for the mashup "${currentMashupTitle}" has been successfully updated to show that it was already mixed.`;

                                if (process.env.NODE_ENV === "production") {
                                  logger.log(updateSuccessStatement);
                                } else {
                                  console.log(updateSuccessStatement);
                                }
                              });
                          });
                        });
                      });
                    });
                } else {
                  managementClient
                    .getSpace(process.env.CONTENTFUL_SPACE_ID)
                    .then((space) => {
                      space.getEnvironment("master").then((environment) => {
                        environment.getEntry(entryID).then((entry) => {
                          // Unpublish and delete entry itself
                          entry
                            .unpublish()
                            .then(async (unpublishedEntry) => {
                              const deletingStatement = `Entry for mashup "${currentMashupTitle}" has been unpublished. Deleting now...`;

                              if (process.env.NODE_ENV === "production") {
                                logger.log(deletingStatement);
                              } else {
                                console.log(deletingStatement);
                              }

                              await delayExecution(1500);

                              unpublishedEntry.delete();
                            })
                            .then(async () => {
                              const deletedStatement = `Entry for mashup "${currentMashupTitle}" has been deleted.`;

                              if (process.env.NODE_ENV === "production") {
                                logger.log(deletedStatement);
                              } else {
                                console.log(deletedStatement);
                              }

                              await delayExecution(1500);

                              // Delete mashup MP3 audio asset
                              if (mixID) {
                                environment.getAsset(mixID).then((mixAsset) => {
                                  mixAsset
                                    .unpublish()
                                    .then(async (unpublishedMixAsset) => {
                                      const unpublishedStatement = `MP3 asset for mashup "${currentMashupTitle}" has been unpublished. Deleting now...`;

                                      if (
                                        process.env.NODE_ENV === "production"
                                      ) {
                                        logger.log(unpublishedStatement);
                                      } else {
                                        console.log(unpublishedStatement);
                                      }

                                      await delayExecution(1500);

                                      unpublishedMixAsset.delete();
                                    })
                                    .then(async () => {
                                      const deletedStatement = `MP3 asset for mashup "${currentMashupTitle}" has been deleted.`;

                                      if (
                                        process.env.NODE_ENV === "production"
                                      ) {
                                        logger.log(deletedStatement);
                                      } else {
                                        console.log(deletedStatement);
                                      }
                                    });
                                });
                              }
                            });
                        });
                      });
                    });
                }
              }
            }
          }
        }
      }
    });
};

module.exports = { updateActiveMixes };
