const fs = require("fs");
const { checkFileExists } = require("../utils/checkFileExists");
const contentful = require("contentful-management");
const { logger } = require("../../logger/logger");
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
        () => {
          const leftoverDeletedStatement = "Leftover trimmed_mix file deleted!";

          if (process.env.NODE_ENV === "production") {
            logger("server").info(leftoverDeletedStatement);
          } else {
            console.log(leftoverDeletedStatement);
          }
        }
      );
    }
  };

  if (accompaniment && vocals) {
    if (mixExists) {
      const songMode = accompaniment.mode;
      const accompanimentTitle = accompaniment.title;
      const accompanimentArtist = accompaniment.artist;
      const accompanimentID = accompaniment.id;
      const vocalsTitle = vocals.title;
      const vocalsArtist = vocals.artist;
      const vocalsID = vocals.id;

      const truncateString = (str) => {
        if (str.length > 50) {
          return str.slice(0, 51) + "...";
        } else {
          return str;
        }
      };

      const mashupTitle = `MASHUP - "${truncateString(
        accompanimentTitle
      )}" by ${truncateString(accompanimentArtist)} x "${truncateString(
        vocalsTitle
      )}" by ${truncateString(vocalsArtist)}`;

      const getErrorLogs = (err) => {
        if (process.env.NODE_ENV === "production") {
          logger("server").error(
            `Received error during entry creation: ${err}`
          );
        } else {
          console.error(`Received error during entry creation: ${err}`);
        }
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
                      fileName: `${truncateString(
                        accompanimentTitle
                      )} ${truncateString(
                        accompanimentArtist
                      )} x ${truncateString(vocalsTitle)} ${truncateString(
                        vocalsArtist
                      )} mashup.mp3`
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
                      blacklisted: {
                        "en-US": "pending",
                      },
                      duration: {
                        "en-US": mp3Duration,
                      },
                      mode: {
                        "en-US": songMode,
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

                    if (process.env.NODE_ENV === "production") {
                      logger("server").info(successStatement);
                    } else {
                      console.log(successStatement);
                    }

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

      if (process.env.NODE_ENV === "production") {
        logger("server").info(doesntExistStatement);
      } else {
        console.log(doesntExistStatement);
      }

      return;
    }
  } else {
    const doesntExistStatement =
      "Both accompaniment and vocals parameters are required in the addMixToContentful.js function! Aborting process and moving on to next mashup.";

    if (process.env.NODE_ENV === "production") {
      logger("server").info(doesntExistStatement);
    } else {
      console.log(doesntExistStatement);
    }

    return;
  }
};

module.exports = { addMixToContentful };
