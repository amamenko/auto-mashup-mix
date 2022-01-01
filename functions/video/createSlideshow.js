const wget = require("wget-improved");
const fs = require("fs");
const { exec } = require("child_process");
const { combineIntroWithMain } = require("./combineIntroWithMain");
const { readStartEndTimes } = require("../utils/readStartEndTimes");

const createSlideshow = () => {
  const download = wget.download(
    process.env.INTRO_VIDEO_LINK,
    "initial_intro.mp4"
  );

  download.on("error", (err) => {
    console.error(err);
    return;
  });

  download.on("end", async () => {
    console.log("Done downloading intro video!");

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

    for (let i = 0; i < allFiles.length; i++) {
      if (i === 0) {
        totalsDelay += Number(startEndTimesArr[i].mixEnd);
        totalsArr.push(totalsDelay);
      } else if (i === allFiles.length - 1) {
        totalsDelay += Number(
          startEndTimesArr[i].duration - startEndTimesArr[i].mixStart
        );
        totalsArr.push(totalsDelay);
      } else {
        totalsDelay += Number(
          startEndTimesArr[i].mixEnd - startEndTimesArr[i].mixStart
        );
        totalsArr.push(totalsDelay);
      }
    }

    const command = `ffmpeg \
    ${allFiles
      .map(
        (item, i, arr) =>
          `-loop 1 -t ${
            i === 0
              ? startEndTimesArr[i].mixEnd
              : i === arr.length - 1
              ? startEndTimesArr[i].duration - startEndTimesArr[i].mixStart
              : startEndTimesArr[i].mixEnd - startEndTimesArr[i].mixStart
          } -i ./video_images/${item} \ `
      )
      .join("")} -filter_complex \
    "[0]fade=t=in:st=0:d=2[0:a]; \ ${allFiles
      .slice(1)
      .map((item, i, arr) =>
        i === arr.length - 1
          ? `[${i + 1}]format=yuva444p,fade=d=5:t=in:alpha=1,fade=st=${
              startEndTimesArr[i].duration - startEndTimesArr[i].mixStart
            }:d=2:t=out,setpts=PTS-STARTPTS+${
              Math.round(totalsArr[i]) - (i * 5 + 5)
            }/TB[f${i}]; \ `
          : `[${
              i + 1
            }]format=yuva444p,fade=d=5:t=in:alpha=1,setpts=PTS-STARTPTS+${
              Math.round(totalsArr[i]) - (i * 5 + 5)
            }/TB[f${i}]; \ `
      )
      .join("")} ${allFiles
      .slice(1)
      .map((item, i, arr) =>
        i === 0
          ? `[0:a][f0]overlay[bg1];`
          : i === arr.length - 1
          ? `[bg${i}][f${i}]overlay,format=yuv420p[v]" -map "[v]" initial_main.mp4`
          : `[bg${i}][f${i}]overlay[bg${i + 1}];`
      )
      .join("")}`;

    console.log(command);
    console.log(totalsArr);

    const start = Date.now();

    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(`exec error: ${err}`);
        return;
      } else {
        console.log(
          `Successfully created main mix video! The process took ${
            (Date.now() - start) / 1000
          } seconds.`
        );
        combineIntroWithMain();
      }
    });
  });
};

module.exports = { createSlideshow };
