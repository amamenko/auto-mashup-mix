const contentful = require("contentful");
const { generateSongImage } = require("../images/generateSongImage");
const { delayExecution } = require("../utils/delayExecution");

const getMashupImages = async (currentMashup, i) => {
  // Access to Contentful Delivery API
  const client = contentful.createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
  });

  return new Promise(async (resolve, reject) => {
    const currentAccompanimentID = currentMashup.fields.accompanimentSysId;
    const currentVocalsID = currentMashup.fields.vocalsSysId;
    const currentIDs = currentAccompanimentID + "," + currentVocalsID;

    await delayExecution(i * 10000);

    await client
      .getEntries({
        "sys.id[in]": currentIDs,
        content_type: "song",
      })
      .then(async (songRes) => {
        if (songRes) {
          if (songRes.items && songRes.items.length === 2) {
            const accompanimentEntry = songRes.items.find(
              (item) => item.sys.id === currentAccompanimentID
            );
            const vocalsEntry = songRes.items.find(
              (item) => item.sys.id === currentVocalsID
            );

            if (accompanimentEntry && vocalsEntry) {
              let retries = 5;
              let success = false;

              while (retries !== 0 && !success) {
                await generateSongImage(
                  accompanimentEntry.fields,
                  vocalsEntry.fields,
                  i
                )
                  .then(() => {
                    success = true;
                    console.log(
                      `Successfully generated image for ${currentMashup.fields.title}.`
                    );
                    resolve();
                  })
                  .catch((e) => {
                    retries--;
                    console.error(e);
                  });
              }

              if (retries === 0) {
                reject();
              }
            }
          }
        }
      });
  });
};

module.exports = { getMashupImages };
