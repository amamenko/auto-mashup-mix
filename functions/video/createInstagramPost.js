const fs = require("fs");
const Instagram = require("instagram-web-api");
const FileCookieStore = require("tough-cookie-filestore2");
const { format, startOfWeek } = require("date-fns");
const { checkExistsAndDelete } = require("../utils/checkExistsAndDelete");
const { checkFileExists } = require("../utils/checkFileExists");
const {
  cleanUpRemainingFilesAfterVideo,
} = require("../utils/cleanUpRemainingFilesAfterVideo");
const { logger } = require("../logger/initializeLogger");
require("dotenv").config();

const createInstagramPost = async (videoTitle) => {
  const thumbnailExists = await checkFileExists("thumbnail.png");

  const loggerLog = (statement) => {
    if (process.env.NODE_ENV === "production") {
      logger.log(statement);
    } else {
      console.log(statement);
    }
  };

  if (videoTitle) {
    if (thumbnailExists) {
      // Persist cookies after Instagram client log in
      const cookieStore = new FileCookieStore("./cookies.json");

      const client = new Instagram(
        {
          username: process.env.INSTAGRAM_USERNAME,
          password: process.env.INSTAGRAM_PASSWORD,
          cookieStore,
        },
        {
          language: "en-US",
        }
      );

      const instagramPostFunction = async (currentClient) => {
        let triesCounter = 0;

        while (triesCounter < 3) {
          loggerLog(`Try #${triesCounter}`);
          try {
            const mostRecentSaturday = format(
              startOfWeek(new Date(), {
                weekStartsOn: 6,
              }),
              "PPPP"
            );

            const titleSplit = videoTitle.split(" - ");
            const allArtists = titleSplit[2];

            const newCaption = `Auto Mashup presents the automated mashups for the week of ${mostRecentSaturday}. ${
              allArtists
                ? `This week's mashups include songs by ${
                    allArtists.split(", ")[0]
                  }, ${allArtists.split(", ")[1]}, and ${
                    allArtists.split(", ")[2]
                  }.`
                : ""
            }\nCheck out the channel link in the bio!`;

            if (currentClient) {
              return await currentClient
                .uploadPhoto({
                  photo: "thumbnail.png",
                  caption: newCaption,
                  post: "feed",
                })
                .then(async (res) => {
                  const media = res.media;

                  loggerLog(`https://www.instagram.com/p/${media.code}/`);

                  await cleanUpRemainingFilesAfterVideo();

                  let firstThreeHashtags = "#ffmpeg #mix #python";

                  if (allArtists) {
                    const artistsArr = allArtists.split(", ");
                    const formattedArtists = artistsArr.map(
                      (item) =>
                        "#" +
                        item
                          .toLowerCase()
                          .split(" ")
                          .join("")
                          .replace(/_|'|-/gim, "")
                    );
                    firstThreeHashtags = formattedArtists.join(" ");
                  }

                  await currentClient.addComment({
                    mediaId: media.id,
                    text:
                      firstThreeHashtags +
                      " #automashup #automated #nodejs #contentful #billboard #music #mashup #songs #youtube #spotify #genius #dj",
                  });
                });
            } else {
              loggerLog("Instagram client does not exist!");
              return;
            }
          } catch (err) {
            loggerLog(err);
          }
          triesCounter++;
        }
      };

      const loginFunction = async () => {
        loggerLog("Logging in...");

        await client
          .login()
          .then(() => {
            loggerLog("Login successful!");
            instagramPostFunction(client);
          })
          .catch(async (err) => {
            loggerLog("Login failed!");
            loggerLog(err);

            loggerLog(
              "Deleting cookies, waiting 2 minutes, then logging in again and setting new cookie store"
            );
            fs.unlinkSync("./cookies.json");
            const newCookieStore = new FileCookieStore("./cookies.json");

            const newClient = new Instagram(
              {
                username: process.env.INSTAGRAM_USERNAME,
                password: process.env.INSTAGRAM_PASSWORD,
                cookieStore: newCookieStore,
              },
              {
                language: "en-US",
              }
            );

            const delayedLoginFunction = async (timeout) => {
              setTimeout(async () => {
                loggerLog("Logging in again.");
                await newClient
                  .login()
                  .then(() => {
                    loggerLog("Login successful on the second try!");
                    instagramPostFunction(newClient);
                  })
                  .catch(async (err) => {
                    loggerLog("Login failed again!");
                    loggerLog(err);
                    await cleanUpRemainingFilesAfterVideo();
                  });
              }, timeout);
            };

            // Wait 2 minutes before trying to log in again
            await delayedLoginFunction(120000);
          });
      };

      loginFunction();
    } else {
      loggerLog("No thumbnail photo exists. Can't post to Instagram.");
      return;
    }
  } else {
    loggerLog(
      "Video title was not provided to the Instagram post function! Can't post to Instagram."
    );
    await checkExistsAndDelete("thumbnail.png");
    return;
  }
};

module.exports = { createInstagramPost };