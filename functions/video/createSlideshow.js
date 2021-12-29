const axios = require("axios");
const wget = require("wget-improved");
const fs = require("fs");
const { exec } = require("child_process");
const { combineIntroWithMain } = require("./combineIntroWithMain");

const createSlideshow = () => {
  const download = wget.download(process.env.INTRO_VIDEO_LINK, "intro.avi");

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

    const command = `ffmpeg \
    ${allFiles
      .map((item) => `-loop 1 -t 5 -i ./video_images/${item} \ `)
      .join("")} -filter_complex \
    "[0]fade=t=in:st=0:d=2[0:a]; \ ${allFiles
      .slice(1)
      .map((item, i, arr) =>
        i === arr.length - 1
          ? `[${
              i + 1
            }]format=yuva444p,fade=d=1:t=in:alpha=1,fade=st=3:d=2:t=out,setpts=PTS-STARTPTS+${
              (i + 1) * 4
            }/TB[f${i}]; \ `
          : `[${
              i + 1
            }]format=yuva444p,fade=d=1:t=in:alpha=1,setpts=PTS-STARTPTS+${
              (i + 1) * 4
            }/TB[f${i}]; \ `
      )
      .join("")} ${allFiles
      .slice(1)
      .map((item, i, arr) =>
        i === 0
          ? `[0:a][f0]overlay[bg1];`
          : i === arr.length - 1
          ? `[bg${i}][f${i}]overlay,format=yuv420p[v]" -map "[v]" output.avi`
          : `[bg${i}][f${i}]overlay[bg${i + 1}];`
      )
      .join("")}`;

    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(`exec error: ${err}`);
        return;
      } else {
        console.log("DONE");
        combineIntroWithMain();
      }
    });
  });
};

module.exports = { createSlideshow };
