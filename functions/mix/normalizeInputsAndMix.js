const fs = require("fs");
const axios = require("axios");
const { mixTracks } = require("./mixTracks");
const { delayExecution } = require("../utils/delayExecution");
const { logger } = require("../logger/initializeLogger");
require("dotenv").config();

const normalizeInputsAndMix = async (instrumentals, vocals) => {
  if (instrumentals && vocals) {
    const accompanimentLink = instrumentals.accompaniment.fields.file.url;
    const voxLink = vocals.vocals.fields.file.url;

    if (accompanimentLink && voxLink) {
      const accompanimentURL = "https:" + accompanimentLink;
      const voxURL = "https:" + voxLink;

      if (!fs.existsSync("./functions/mix/inputs")) {
        fs.mkdirSync("./functions/mix/inputs");
      }

      const accompanimentPath = "./functions/mix/inputs/accompaniment.mp3";
      const voxPath = "./functions/mix/inputs/vox.mp3";

      const streamArr = [
        {
          name: "accompaniment",
          url: accompanimentURL,
          path: accompanimentPath,
        },
        {
          name: "vox",
          url: voxURL,
          path: voxPath,
        },
      ];

      for (const file of streamArr) {
        const writer = fs.createWriteStream(file.path);

        const response = await axios({
          url: file.url,
          method: "GET",
          responseType: "stream",
        });

        response.data.pipe(writer);

        response.data.on("error", (err) => {
          const errorStatement =
            "Received an error when attempting to download song entry audio. Terminating process. Output: ";

          if (process.env.NODE_ENV === "production") {
            logger.error(errorStatement, {
              indexMeta: true,
              meta: {
                message: err,
              },
            });
          } else {
            console.error(errorStatement + err);
          }

          return;
        });
      }

      await delayExecution(10000);

      mixTracks(instrumentals, vocals, accompanimentPath, voxPath);
    }
  }
};

module.exports = { normalizeInputsAndMix };
