const fs = require("fs");
const wget = require("wget-improved");
const { logger } = require("../../logger/logger");
const spawnCommand = require("../utils/spawnCommand");
const { readStartEndTimes } = require("../utils/readStartEndTimes");
const { addGreenScreenBanners } = require("./addGreenScreenBanners");
require("dotenv").config();

const createSlideshow = (voxAccompanimentNames) => {
  const download = wget.download(
    process.env.INTRO_VIDEO_LINK,
    "initial_intro.mp4"
  );

  download.on("error", (err) => {
    if (process.env.NODE_ENV === "production") {
      logger("server").error(
        `Received error when attempting to download intro video: ${err}`
      );
    } else {
      console.error(err);
    }

    return;
  });

  download.on("end", async () => {
    const doneStatement = "Done downloading intro video!";

    if (process.env.NODE_ENV === "production") {
      logger("server").info(doneStatement);
    } else {
      console.log(doneStatement);
    }

    let allFiles = fs
      .readdirSync("video_images")
      .map((item) => {
        return {
          name: item,
          number: Number(item.split("_")[1].split(".")[0]),
        };
      })
      .sort((a, b) => a.number - b.number);

    allFiles = allFiles.map((item) => item.name);

    const startEndTimesArr = await readStartEndTimes();

    let totalsDelay = 0;
    const totalsArr = [];

    const writeToDescription = (totalsDelay, title, intro) => {
      const minutesField = Math.floor(totalsDelay / 60);
      const secondsField = (
        totalsDelay -
        Math.floor(totalsDelay / 60) * 60
      ).toLocaleString("en-US", {
        minimumIntegerDigits: 2,
        maximumFractionDigits: 0,
        useGrouping: false,
      });

      fs.writeFile(
        "description.txt",
        `${intro ? `Timestamps\n0:00 - Intro\n` : ""}${
          (secondsField.toString() === "60" ? minutesField + 1 : minutesField) +
          ":" +
          (secondsField.toString() === "60" ? "00" : secondsField)
        } - ${title}\n`,
        { flag: "a" },
        (err) => {
          if (err) {
            if (process.env.NODE_ENV === "production") {
              logger("server").error(
                `Received error when attempting to write to description.txt: ${err}`
              );
            } else {
              console.error(err);
            }
          }
        }
      );
    };

    let delayEndThanks = 0;

    for (let i = 0; i < allFiles.length; i++) {
      if (i === 0) {
        writeToDescription(5, startEndTimesArr[i].title, true);
        totalsDelay += Number(startEndTimesArr[i].mixEnd);
        totalsArr.push(totalsDelay);
      } else if (i === allFiles.length - 1) {
        writeToDescription(
          totalsDelay - (i - 1) * 5,
          startEndTimesArr[i].title
        );
        delayEndThanks = totalsDelay - (i - 1) * 5;
        totalsDelay += Number(
          startEndTimesArr[i].duration - startEndTimesArr[i].mixStart
        );
        totalsArr.push(totalsDelay);
      } else {
        writeToDescription(
          totalsDelay - (i - 1) * 5,
          startEndTimesArr[i].title
        );
        totalsDelay += Number(
          startEndTimesArr[i].mixEnd - startEndTimesArr[i].mixStart
        );
        totalsArr.push(totalsDelay);
      }
    }

    const command = `${allFiles
      .map(
        (item, i, arr) =>
          `-loop 1 -t ${
            i === 0
              ? startEndTimesArr[i].mixEnd
              : i === arr.length - 1
              ? startEndTimesArr[i].duration - startEndTimesArr[i].mixStart
              : startEndTimesArr[i].mixEnd - startEndTimesArr[i].mixStart
          } -i ./video_images/${item}`
      )
      .join(" ")} -filter_complex [0]fade=t=in:st=0:d=2[0:a];${allFiles
      .slice(1)
      .map((item, i, arr) =>
        i === arr.length - 1
          ? `[${
              i + 1
            }]format=yuva444p,fade=d=5:t=in:alpha=1,setpts=PTS-STARTPTS+${
              Math.round(totalsArr[i]) - (i * 5 + 5)
            }/TB[f${i}];`
          : `[${
              i + 1
            }]format=yuva444p,fade=d=5:t=in:alpha=1,setpts=PTS-STARTPTS+${
              Math.round(totalsArr[i]) - (i * 5 + 5)
            }/TB[f${i}];`
      )
      .join("")}${allFiles
      .slice(1)
      .map((item, i, arr) =>
        i === 0
          ? `[0:a][f0]overlay[bg1];`
          : i === arr.length - 1
          ? `[bg${i}][f${i}]overlay,format=yuv420p[v] -map [v] initial_main.mp4`
          : `[bg${i}][f${i}]overlay[bg${i + 1}];`
      )
      .join("")}`;

    const start = Date.now();

    spawnCommand(
      "ffmpeg",
      command,
      // On error
      async () => {
        await checkExistsAndDelete("initial_main.mp4");
      },
      // On finish
      async () => {
        const successStatement = `Successfully created main mix video! The process took ${
          (Date.now() - start) / 1000
        } seconds.`;

        if (process.env.NODE_ENV === "production") {
          logger("server").info(successStatement);
        } else {
          console.log(successStatement);
        }

        addGreenScreenBanners(delayEndThanks + 50, voxAccompanimentNames);
      }
    );
  });
};

module.exports = { createSlideshow };
