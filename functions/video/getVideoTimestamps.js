const fs = require("fs");
const { checkFileExists } = require("../utils/checkFileExists");

const getVideoTimestamps = async () => {
  const descriptionTxtExists = await checkFileExists("description.txt");

  if (descriptionTxtExists) {
    const data = fs.readFileSync("description.txt", "utf-8");
    const dataArr = data.split("\n").filter((item) => item);

    const sortedArray = [
      ...dataArr.filter((item) => item === "Timestamps"),
      ...dataArr
        .filter((item) => item && item !== "Timestamps")
        .sort((a, b) => {
          const formattedSeconds = (item) => {
            const minuteSeconds = item.split(" - ")[0].split(":");
            return Number(minuteSeconds[0]) * 60 + Number(minuteSeconds[1]);
          };
          return formattedSeconds(a) - formattedSeconds(b);
        }),
    ];

    console.log(sortedArray.join("\n"));
  }
};

module.exports = { getVideoTimestamps };
