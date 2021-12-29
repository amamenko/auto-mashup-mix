const { exec } = require("child_process");

const combineIntroWithMain = () => {
  const command = `ffmpeg -i intro.mp4 -i output.mp4 -filter_complex \
  "[0:v][0:a][1:v][1:a] concat=n=2:v=1:a=1 [outv] [outa]" \
  -map "[outv]" -map "[outa]" out.mp4`;

  exec(command, (err, stdout, stderr) => {
    console.log(stdout);
    if (err) {
      console.error(`exec error: ${err}`);
      return;
    } else {
      console.log("Concatentated intro video with output video");
    }
  });
};

module.exports = { combineIntroWithMain };
