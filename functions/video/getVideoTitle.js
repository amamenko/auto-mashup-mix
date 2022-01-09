const fs = require("fs");
const { format, startOfWeek } = require("date-fns");
const sampleSize = require("lodash.samplesize");
const { checkFileExists } = require("../utils/checkFileExists");

const getVideoTitle = async () => {
  const allArtistsTxtExists = await checkFileExists("allArtists.txt");

  if (allArtistsTxtExists) {
    const data = fs.readFileSync("allArtists.txt", "utf-8");
    let dataArr = data.split("\n").filter((item) => item);
    dataArr = [...new Set(dataArr)];
    dataArr = dataArr.filter((item) => item.length <= 14);
    const highlightedArtists = sampleSize(dataArr, 3);

    const mostRecentSaturday = format(
      startOfWeek(new Date(), {
        weekStartsOn: 6,
      }),
      "MM/dd/yy"
    );

    const fullTitle = `Billboard Automated Mashups - Week of ${mostRecentSaturday} - ${highlightedArtists.join(
      ", "
    )}`;

    return fullTitle;
  }
};

module.exports = { getVideoTitle };
