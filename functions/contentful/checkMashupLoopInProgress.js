const contentful = require("contentful");
const { logger } = require("../../logger/logger");
const { getMostRecentSaturday } = require("../utils/getMostRecentSaturday");
const { updateMixLoopInProgress } = require("./updateMixLoopInProgress");
require("dotenv").config();

const checkMashupLoopInProgress = async () => {
  // Access to Contentful Delivery API
  const client = contentful.createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
  });

  const mostRecentSaturday = getMostRecentSaturday();

  const mixListErrorLog = (err) => {
    if (process.env.NODE_ENV === "production") {
      logger("server").error(
        `Received error when attempting to get mixList entry: ${err}`
      );
    } else {
      console.error(err);
    }
  };

  // Check if there are any loops in progress
  return await client
    .getEntries({
      "fields.loopInProgress": true,
      content_type: "mixList",
    })
    .then(async (res) => {
      if (res) {
        if (res.items) {
          // If there's no loop in progress at the moment
          if (res.items.length === 0) {
            return await client
              .getEntries({
                content_type: "mixList",
                order: "fields.title",
              })
              .then(async (res) => {
                if (res) {
                  if (res.items) {
                    if (res.items.length > 0) {
                      const filteredLists = res.items.filter(
                        (item) =>
                          item.fields.mostRecentLoopWeek !== mostRecentSaturday
                      );
                      const mixListArr = filteredLists.map(
                        (item) => item.sys.id
                      );

                      if (mixListArr[0]) {
                        await updateMixLoopInProgress(
                          mixListArr[0],
                          "in progress"
                        ).catch((err) => {
                          if (process.env.NODE_ENV === "production") {
                            logger("server").error(
                              `Received error when attempting to update mix loop to 'in progress': ${err}`
                            );
                          } else {
                            console.error(err);
                          }
                        });
                      }
                    }
                  }
                }
              })
              .catch((err) => mixListErrorLog(err));
          }
        }
      }
    })
    .catch((err) => mixListErrorLog(err));
};

module.exports = { checkMashupLoopInProgress };
