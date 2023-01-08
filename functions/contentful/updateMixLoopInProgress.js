const contentfulManagement = require("contentful-management");
const { logger } = require("../../logger/logger");
const { getMostRecentSaturday } = require("../utils/getMostRecentSaturday");
require("dotenv").config();

const updateMixLoopInProgress = async (mixChartID, state) => {
  // Access to Contentful Management API
  const managementClient = contentfulManagement.createClient({
    accessToken: process.env.CONTENT_MANAGEMENT_TOKEN,
  });

  const mostRecentSaturday = getMostRecentSaturday();

  const errorLog = (err) => {
    if (process.env.NODE_ENV === "production") {
      logger("server").error(
        `Received error when attempting to update mix loop in progress: ${err}`
      );
    } else {
      console.error(err);
    }
  };

  return await managementClient
    .getSpace(process.env.CONTENTFUL_SPACE_ID)
    .then(async (space) => {
      return await space
        .getEnvironment("master")
        .then(async (environment) => {
          return await environment
            .getEntry(mixChartID)
            .then(async (entry) => {
              entry.fields.loopInProgress = {
                "en-US": state === "in progress" ? true : false,
              };

              if (state === "done") {
                entry.fields.currentLoopPosition = {
                  "en-US": 0,
                };
              } else {
                entry.fields.mostRecentLoopWeek = {
                  "en-US": mostRecentSaturday,
                };
              }

              return await entry
                .update()
                .then(() => {
                  environment.getEntry(mixChartID).then((updatedEntry) => {
                    updatedEntry.publish();

                    const successStatement = `Entry update was successful! ${
                      updatedEntry.fields.title["en-US"]
                    } loop marked as ${
                      state === "in progress" ? "in progress." : "done."
                    }`;

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
};

module.exports = { updateMixLoopInProgress };
