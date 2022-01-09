const fs = require("fs");
const { exec } = require("child_process");
const { readStartEndTimes } = require("../utils/readStartEndTimes");
const { logger } = require("../logger/initializeLogger");
require("dotenv").config();

const createMixOfAllMashups = async () => {
  const allFiles = fs
    .readdirSync("video_audio")
    .filter((item) => item.includes(".mp3"))
    .map((item) => {
      return {
        name: "./video_audio/" + item,
        number: Number(item.split("_")[1].split(".")[0]),
      };
    })
    .sort((a, b) => a.number - b.number);

  const startEndArr = await readStartEndTimes();

  const command = `ffmpeg ${allFiles
    .map((item) => `-i ${item.name}`)
    .join(" ")} -vn -filter_complex "${allFiles
    .map((item, i, arr) =>
      i === 0
        ? `[${i}]atrim=end=${startEndArr[i].mixEnd},asetpts=PTS-STARTPTS[${i}t];`
        : i === arr.length - 1
        ? `[${i}]afade=t=out:st=${startEndArr[i].mixEnd}:d=${
            startEndArr[i].duration - startEndArr[i].mixEnd
          }[${i}t];`
        : `[${i}]atrim=start=${startEndArr[i].mixStart}:end=${startEndArr[i].mixEnd},asetpts=PTS-STARTPTS[${i}t];`
    )
    .join(" ")}${allFiles
    .map((item, i, arr) =>
      i === 0
        ? `[${i}t][${
            i + 1
          }t]acrossfade=d=5:c1=tri:c2=tri,afade=t=in:st=0:d=10[a1];`
        : i === arr.length - 1
        ? `[a${i}]anull`
        : `[a${i}][${i + 1}t]acrossfade=d=5:c1=tri:c2=tri[a${i + 1}];`
    )
    .join(" ")}" full_mashup_mix.mp3`;

  return new Promise(async (resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        if (process.env.NODE_ENV === "production") {
          logger.error(
            "Received exec error when attempting to create mix of all mashups with FFMPEG",
            {
              indexMeta: true,
              meta: {
                message: err,
              },
            }
          );
        } else {
          console.error(`exec error: ${err}`);
        }

        reject();
        return;
      } else {
        resolve();
      }
    });
  });
};

module.exports = { createMixOfAllMashups };
