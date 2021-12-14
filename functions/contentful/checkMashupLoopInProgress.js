const contentful = require("contentful");
const { updateMixLoopInProgress } = require("./updateMixLoopInProgress");
require("dotenv").config();

const checkMashupLoopInProgress = async () => {
  // Access to Contentful Delivery API
  const client = contentful.createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
  });

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
                "fields.loopedThisWeek": false,
                content_type: "mixList",
              })
              .then(async (res) => {
                if (res) {
                  if (res.items) {
                    if (res.items.length > 0) {
                      const mixListArr = res.items.map((item) => item.sys.id);

                      if (mixListArr[0]) {
                        await updateMixLoopInProgress(
                          mixListArr[0],
                          "in progress"
                        ).catch((err) => console.error(err));
                      }
                    }
                  }
                }
              })
              .catch((err) => console.error(err));
          }
        }
      }
    })
    .catch((err) => console.error(err));
};

module.exports = { checkMashupLoopInProgress };
