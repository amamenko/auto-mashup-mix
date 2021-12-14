const contentfulManagement = require("contentful-management");
require("dotenv").config();

const updateMixLoopInProgress = async (mixChartID, state) => {
  // Access to Contentful Management API
  const managementClient = contentfulManagement.createClient({
    accessToken: process.env.CONTENT_MANAGEMENT_TOKEN,
  });

  return await managementClient
    .getSpace(process.env.CONTENTFUL_SPACE_ID)
    .then((space) => {
      space.getEnvironment("master").then((environment) => {
        environment.getEntry(mixChartID).then((entry) => {
          entry.fields.loopInProgress = {
            "en-US": state === "in progress" ? true : false,
          };

          if (state === "done") {
            entry.fields.loopedThisWeek = {
              "en-US": true,
            };

            entry.fields.currentLoopPosition = {
              "en-US": 0,
            };
          }
          entry.update().then(() => {
            environment.getEntry(mixChartID).then((updatedEntry) => {
              updatedEntry.publish();

              const successStatement = `Entry update was successful! ${
                updatedEntry.fields.title["en-US"]
              } loop marked as ${
                state === "in progress" ? "in progress." : "done."
              }`;

              console.log(successStatement);
            });
          });
        });
      });

      return;
    });
};

module.exports = { updateMixLoopInProgress };
