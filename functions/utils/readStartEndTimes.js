const fs = require("fs");
const { checkFileExists } = require("./checkFileExists");

const readStartEndTimes = async () => {
  const timesExists = await checkFileExists("./video_audio/times.txt");

  if (timesExists) {
    const data = fs.readFileSync("./video_audio/times.txt", "utf8");
    const dataArr = data.split("\n\n").filter((item) => item);
    const startEndArr = dataArr.map((item) => {
      return {
        name: item.split("\n")[0],
        duration: item.split("\n")[1].split(" ")[1],
        mixStart: item.split("\n")[2].split(" ")[1],
        mixEnd: item.split("\n")[3].split(" ")[1],
        title: item.split("\n")[4],
      };
    });

    return startEndArr;
  }
};

module.exports = { readStartEndTimes };
