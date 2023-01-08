const fs = require("fs");
const Instagram = require("../../instagram-web-api/index");
const { format, startOfWeek } = require("date-fns");
const { checkExistsAndDelete } = require("../utils/checkExistsAndDelete");
const { checkFileExists } = require("../utils/checkFileExists");
const {
  cleanUpRemainingFilesAfterVideo,
} = require("../utils/cleanUpRemainingFilesAfterVideo");
const removeAccents = require("remove-accents");
const { logger } = require("../../logger/logger");
const imaps = require("imap-simple");
const _ = require("lodash");
const simpleParser = require("mailparser").simpleParser;
const resizeImg = require("resize-img");
require("dotenv").config();

const createInstagramPost = async (videoTitle) => {
  const thumbnailExists = await checkFileExists("thumbnail.jpg");

  const loggerLog = (statement) => {
    if (process.env.NODE_ENV === "production") {
      logger("server").info(statement);
    } else {
      console.log(statement);
    }
  };

  if (videoTitle) {
    if (thumbnailExists) {
      // Image needs to be resized - otherwise Instagram returns unprocessable entity error
      const resizedImage = await resizeImg(fs.readFileSync("thumbnail.jpg"), {
        width: 1280,
        height: 720,
        format: "jpg",
      });

      // Overwrites original file with resized image
      fs.writeFileSync("thumbnail.jpg", resizedImage);

      const client = new Instagram(
        {
          username: process.env.INSTAGRAM_USERNAME,
          password: process.env.INSTAGRAM_PASSWORD,
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
            }\n\nYouTube channel link in bio!`;

            if (currentClient) {
              return await currentClient
                .uploadPhoto({
                  photo: "thumbnail.jpg",
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
                        removeAccents(item)
                          .toLowerCase()
                          .split(" ")
                          .join("")
                          .replace(/[\W_]+/gim, "")
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

            const delayedLoginFunction = async (timeout) => {
              setTimeout(async () => {
                loggerLog("Logging in again.");
                const newClient = new Instagram(
                  {
                    username: process.env.INSTAGRAM_USERNAME,
                    password: process.env.INSTAGRAM_PASSWORD,
                  },
                  {
                    language: "en-US",
                  }
                );
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

            if (err.statusCode === 403 || err.statusCode === 429) {
              loggerLog(
                "Throttled! Waiting 2 minutes, then logging in again..."
              );
              // Wait 2 minutes before trying to log in again
              await delayedLoginFunction(120000);
            }

            // Instagram has thrown a checkpoint error
            if (err.error && err.error.message === "checkpoint_required") {
              const challengeUrl = err.error.checkpoint_url;

              await client.updateChallenge({ challengeUrl, choice: 1 });

              const emailConfig = {
                imap: {
                  user: `${process.env.AUTO_MASHUP_MIX_EMAIL}`,
                  password: `${process.env.AUTO_MASHUP_MIX_EMAIL_PASSWORD}`,
                  host: "imap.gmail.com",
                  port: 993,
                  tls: true,
                  tlsOptions: {
                    servername: "imap.gmail.com",
                    rejectUnauthorized: false,
                  },
                  authTimeout: 30000,
                },
              };

              // Connect to email and solve Instagram challenge after delay
              const delayedEmailFunction = async (timeout) => {
                setTimeout(() => {
                  imaps.connect(emailConfig).then(async (connection) => {
                    return connection.openBox("INBOX").then(async () => {
                      // Fetch emails from the last hour
                      const delay = 1 * 3600 * 1000;
                      let lastHour = new Date();
                      lastHour.setTime(Date.now() - delay);
                      lastHour = lastHour.toISOString();
                      const searchCriteria = ["ALL", ["SINCE", lastHour]];
                      const fetchOptions = {
                        bodies: [""],
                      };
                      return connection
                        .search(searchCriteria, fetchOptions)
                        .then((messages) => {
                          messages.forEach((item) => {
                            const all = _.find(item.parts, { which: "" });
                            const id = item.attributes.uid;
                            const idHeader = "Imap-Id: " + id + "\r\n";
                            simpleParser(
                              idHeader + all.body,
                              async (err, mail) => {
                                if (err) {
                                  loggerLog(err);
                                }

                                loggerLog(mail.subject);

                                const answerCodeArr = mail.text
                                  .split("\n")
                                  .filter(
                                    (item) =>
                                      item &&
                                      /^\S+$/.test(item) &&
                                      !isNaN(Number(item))
                                  );

                                if (mail.text.includes("Instagram")) {
                                  if (answerCodeArr.length > 0) {
                                    // Answer code must be kept as string type and not manipulated to a number type to preserve leading zeros
                                    const answerCode = answerCodeArr[0];
                                    loggerLog(answerCode);

                                    await client.updateChallenge({
                                      challengeUrl,
                                      securityCode: answerCode,
                                    });

                                    loggerLog(
                                      `Answered Instagram security challenge with answer code: ${answerCode}`
                                    );

                                    await client
                                      .login()
                                      .then(() => {
                                        loggerLog(
                                          "Login successful after successfully completing Instagram challenge!"
                                        );
                                        instagramPostFunction(client);
                                      })
                                      .catch((err) => loggerLog(err));
                                  }
                                }
                              }
                            );
                          });
                        });
                    });
                  });
                }, timeout);
              };

              await delayedEmailFunction(40000);
            }
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
    await checkExistsAndDelete("thumbnail.jpg");
    return;
  }
};

module.exports = { createInstagramPost };
