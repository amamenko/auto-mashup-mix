const contentfulManagement = require("contentful-management");
const contentful = require("contentful");
const { logger } = require("../../logger/logger");
require("dotenv").config();

const updateLatestVideoURL = async (url, voxAccompanimentNames) => {
  // Access to Contentful Delivery API
  const client = contentful.createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
  });

  if (url) {
    const errorLog = (err) => {
      if (process.env.NODE_ENV === "production") {
        logger("server").error(
          `Received error when attempting to update latest video URL entry: ${err}`
        );
      } else {
        console.error(err);
      }
    };

    return await client
      .getEntries({
        content_type: "video",
      })
      .then(async (res) => {
        if (res) {
          if (res.items) {
            // Should only ever be one entry of type video
            if (res.items[0] && res.items[0].sys.id) {
              const entryID = res.items[0].sys.id;

              // Access to Contentful Management API
              const managementClient = contentfulManagement.createClient({
                accessToken: process.env.CONTENT_MANAGEMENT_TOKEN,
              });

              return await managementClient
                .getSpace(process.env.CONTENTFUL_SPACE_ID)
                .then(async (space) => {
                  return await space
                    .getEnvironment("master")
                    .then(async (environment) => {
                      return await environment
                        .getEntry(entryID)
                        .then(async (entry) => {
                          entry.fields.latestUrl = {
                            "en-US": url,
                          };

                          if (voxAccompanimentNames) {
                            entry.fields.latestMashups = {
                              "en-US": voxAccompanimentNames,
                            };
                          }

                          return await entry
                            .update()
                            .then(() => {
                              environment
                                .getEntry(entryID)
                                .then((updatedEntry) => {
                                  updatedEntry.publish();

                                  const successStatement = `Successfully updated entry for latest YouTube video. The new latest URL is ${url}.`;

                                  if (process.env.NODE_ENV === "production") {
                                    logger("server").info(successStatement);
                                  } else {
                                    console.log(successStatement);
                                  }

                                  return;
                                });
                            })
                            .catch((e) => errorLog(e));
                        })
                        .catch((e) => errorLog(e));
                    })
                    .catch((e) => errorLog(e));
                })
                .catch((e) => errorLog(e));
            }
          }
        }
      })
      .catch((err) => errorLog(err));
  } else {
    const noURLStatement =
      "No URL was provided. Can't update latest YouTube video entry's URL!";

    if (process.env.NODE_ENV === "production") {
      logger("server").info(noURLStatement);
    } else {
      console.log(noURLStatement);
    }

    return;
  }
};

module.exports = { updateLatestVideoURL };
