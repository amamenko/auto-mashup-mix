const fs = require("fs");
const { format, startOfWeek } = require("date-fns");
const { checkFileExists } = require("../utils/checkFileExists");

const getVideoDescription = async () => {
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

    const mostRecentSaturday = format(
      startOfWeek(new Date(), {
        weekStartsOn: 6,
      }),
      "PPPP"
    );

    const introductionText = `Auto Mashup presents the automated mashups for the week of ${mostRecentSaturday}.\n\nThese mashups consist of the most popular songs reported by Billboard across various weekly charts including the Hot 100, Billboard 200, Radio Songs, etc., as well as various Billboard GOAT (Greatest of All Time) charts including GOAT Hot 100 Songs, GOAT Songs of the '90s, GOAT Songs of the Summer, etc.\n\nThe video itself and every mashup featured in it were automatically generated using Node.js, Contentful, and FFMPEG.`;
    const projectDetailsText = `You can visit the Auto Mashup website at https://automashup.ml\nSupport the Auto Mashup project at https://www.buymeacoffee.com/automashup\nThe GitHub repo for Auto Mashup can be found at https://github.com/amamenko/auto-mashup\nFollow Auto Mashup (@automaticmashup) on Instagram at https://www.instagram.com/automaticmashup\n\nAuto Mashup was created in early 2022 by Avi Mamenko.\n\nYou can visit Avi's official coding channel at https://www.youtube.com/c/AviMamenko\nAvi's GitHub profile can be found at https://github.com/amamenko\nAvi's web development portfolio can be found at https://amamenko.github.io`;

    return `${introductionText}\n\n${sortedArray.join(
      "\n"
    )}\n\n${projectDetailsText}`;
  }
};

module.exports = { getVideoDescription };
