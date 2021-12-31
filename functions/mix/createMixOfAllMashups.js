const fs = require("fs");
const { exec } = require("child_process");

const createMixOfAllMashups = () => {
  const allFiles = fs
    .readdirSync("video_audio")
    .map((item) => {
      return {
        name: "./video_audio/" + item,
        number: Number(item.split("_")[1].split(".")[0]),
      };
    })
    .sort((a, b) => a.number - b.number);

  const command = `ffmpeg ${allFiles
    .map((item) => `-i ${item.name}`)
    .join(" ")} -vn -filter_complex ${allFiles
    .map((item, i, arr) =>
      i === 0
        ? `"[${i}][${i + 1}]acrossfade=d=10:c1=tri:c2=tri,afade=t=in:d=10[a1];`
        : i === arr.length - 1
        ? `[a${i}][${i + 1}]acrossfade=d=10:c1=tri:c2=tri,afade=t=out:d=10"`
        : `[a${i}][${i + 1}]acrossfade=d=10:c1=tri:c2=tri[a${i + 1}];`
    )
    .join(" ")} full_mashup_mix.mp3`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(`exec error: ${err}`);
      return;
    } else {
      console.log(
        "Successfully created full crossfaded mix of all mashup audio files!"
      );
    }
  });
};

module.exports = { createMixOfAllMashups };
