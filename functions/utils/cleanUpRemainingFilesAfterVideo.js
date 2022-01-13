const { checkExistsAndDelete } = require("./checkExistsAndDelete");
const { exec } = require("child_process");

const cleanUpRemainingFilesAfterVideo = async () => {
  await checkExistsAndDelete("merged.mp4");
  await checkExistsAndDelete("thumbnail.jpg");
  await checkExistsAndDelete("allArtists.txt");
  await checkExistsAndDelete("description.txt");

  // Kill all leftover Puppeteer processes
  exec("pkill -9 -f puppeteer");
};

module.exports = { cleanUpRemainingFilesAfterVideo };
