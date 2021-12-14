const fs = require("fs");
const { checkFileExists } = require("../utils/checkFileExists");
const contentful = require("contentful-management");
require("dotenv").config();

const addMixToContentful = async (
  accompaniment,
  vocals,
  mp3Duration,
  mixStart,
  mixEnd
) => {
  // Access to Contentful's Content Management API
  const client = contentful.createClient({
    accessToken: process.env.CONTENT_MANAGEMENT_TOKEN,
  });

  const mixExists = await checkFileExists("trimmed_mix.mp3");

  const deleteTrimmedMix = async () => {
    if (await checkFileExists("trimmed_mix.mp3")) {
      fs.rm(
        "trimmed_mix.mp3",
        {
          recursive: true,
          force: true,
        },
        () => console.log("Leftover trimmed_mix file deleted!")
      );
    }
  };

  if (accompaniment && vocals) {
    if (mixExists) {
      const accompanimentTitle = accompaniment.fields.title;
      const accompanimentArtist = accompaniment.fields.artist;
      const accompanimentID = accompaniment.sys.id;
      const vocalsTitle = vocals.fields.title;
      const vocalsArtist = vocals.fields.artist;
      const vocalsID = vocals.sys.id;
      const mashupTitle = `MASHUP - "${accompanimentTitle}" by ${accompanimentArtist} x "${vocalsTitle}" by ${vocalsArtist}`;

      const getErrorLogs = (err) => {
        console.error(`Received error during entry creation: ${err}`);
      };

      client.getSpace(process.env.CONTENTFUL_SPACE_ID).then((space) => {
        space
          .getEnvironment("master")
          .then((environment) => {
            // First add the accompaniment track as an asset in Contentful
            environment
              .createAssetFromFiles({
                fields: {
                  title: {
                    "en-US": mashupTitle,
                  },
                  description: {
                    "en-US": `This is the mashup mix mp3 track of the accompaniment track "${accompanimentTitle}" by ${accompanimentArtist} with the vocals track "${vocalsTitle}" by ${vocalsArtist}.`,
                  },
                  file: {
                    "en-US": {
                      contentType: "audio/mp3",
                      fileName:
                        `${accompanimentTitle} ${accompanimentArtist} x ${vocalsTitle} ${vocalsArtist} mashup.mp3`
                          .toLowerCase()
                          .replace(/ /g, "_"),
                      file: fs.readFileSync("trimmed_mix.mp3"),
                    },
                  },
                },
              })
              .then((asset) => asset.processForAllLocales())
              .then((asset) => asset.publish())
              .then(async (mashupAsset) => {
                return environment
                  .createEntry("mashup", {
                    fields: {
                      title: {
                        "en-US": mashupTitle,
                      },
                      duration: {
                        "en-US": mp3Duration,
                      },
                      accompanimentTitle: {
                        "en-US": accompanimentTitle,
                      },
                      accompanimentArtist: {
                        "en-US": accompanimentArtist,
                      },
                      accompanimentSysId: {
                        "en-US": accompanimentID,
                      },
                      vocalsTitle: {
                        "en-US": vocalsTitle,
                      },
                      vocalsArtist: {
                        "en-US": vocalsArtist,
                      },
                      vocalsSysId: {
                        "en-US": vocalsID,
                      },
                      mixStart: {
                        "en-US": mixStart,
                      },
                      mixEnd: {
                        "en-US": mixEnd,
                      },
                      mix: {
                        "en-US": {
                          sys: {
                            id: mashupAsset.sys.id,
                            linkType: "Asset",
                            type: "Link",
                          },
                        },
                      },
                    },
                  })
                  .then((entry) => {
                    entry.publish();
                    deleteTrimmedMix();

                    const successStatement =
                      "Successfully created new mashup entry!";

                    console.log(successStatement);

                    return;
                  })
                  .catch((err) => {
                    getErrorLogs(err);
                    deleteTrimmedMix();
                    return err;
                  });
              })
              .catch((err) => {
                getErrorLogs(err);
                deleteTrimmedMix();
                return err;
              });
          })
          .catch((err) => {
            getErrorLogs(err);
            deleteTrimmedMix();
            return err;
          });
      });
    } else {
      const doesntExistStatement =
        "Mashup mp3 audio does not exist! Moving on to next mashup.";
      console.log(doesntExistStatement);

      return;
    }
  } else {
    const doesntExistStatement =
      "Both accompaniment and vocals parameters are required in the addMixToContentful.js function! Aborting process and moving on to next mashup.";
    console.log(doesntExistStatement);

    return;
  }
};

module.exports = { addMixToContentful };
