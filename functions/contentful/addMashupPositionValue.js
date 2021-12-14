const contentfulManagement = require("contentful-management");
require("dotenv").config();

const addMashupPositionValue = async (mixChartID, currentIndex) => {
  // Access to Contentful Management API
  const managementClient = contentfulManagement.createClient({
    accessToken: process.env.CONTENT_MANAGEMENT_TOKEN,
  });

  return await managementClient
    .getSpace(process.env.CONTENTFUL_SPACE_ID)
    .then((space) => {
      space.getEnvironment("master").then((environment) => {
        environment.getEntry(mixChartID).then((entry) => {
          entry.fields.currentLoopPosition = {
            "en-US": currentIndex + 1,
          };

          entry.update().then(() => {
            environment.getEntry(mixChartID).then((updatedEntry) => {
              updatedEntry.publish();
            });
          });
        });
      });
    });
};

module.exports = { addMashupPositionValue };
