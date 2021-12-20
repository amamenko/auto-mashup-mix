const contentful = require("contentful");
const { getMonth } = require("date-fns");
const sampleSize = require("lodash.samplesize");
const { holidaysArr } = require("../arrays/holidaysArr");
require("dotenv").config();

const getMashupsForVideo = async () => {
  // Access to Contentful Delivery API
  const client = contentful.createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
  });

  return await client
    .getEntries({
      "fields.blacklisted": "no",
      content_type: "mashup",
      limit: 1000,
    })
    .then((res) => {
      if (res) {
        if (res.items && res.items.length > 0) {
          let totalDuration = 0;
          const finalMashupArr = [];

          // Get random 40 approved mashups
          let mashups = sampleSize(res.items, 40);

          const currentMonth = getMonth(new Date());

          // If month is December, make sure at least 5 holiday songs are included, if available
          if (currentMonth === 11) {
            const allHolidayMashups = res.items.filter(
              (mashup) =>
                holidaysArr.some((item) =>
                  mashup.fields.accompanimentTitle.toLowerCase().includes(item)
                ) ||
                holidaysArr.some((item) =>
                  mashup.fields.vocalsTitle.toLowerCase().includes(item)
                )
            );

            if (allHolidayMashups.length > 0) {
              const holidayMashups = sampleSize(allHolidayMashups, 5);

              for (let i = 0; i < holidayMashups.length; i++) {
                const currentMashup = holidayMashups[i];

                finalMashupArr[i * 2] = currentMashup;
                totalDuration += currentMashup.fields.duration;
              }

              // Filter out all holiday songs from original selected mashups to avoid duplicate holiday songs
              mashups = mashups.filter(
                (mashup) =>
                  !holidaysArr.some((item) =>
                    mashup.fields.accompanimentTitle
                      .toLowerCase()
                      .includes(item)
                  ) ||
                  !holidaysArr.some((item) =>
                    mashup.fields.vocalsTitle.toLowerCase().includes(item)
                  )
              );
            }
          }

          for (let i = 0; i < mashups.length; i++) {
            const currentMashup = mashups[i];
            const lastMashup = mashups[i - 1];

            if (
              lastMashup &&
              currentMashup &&
              (lastMashup.fields.accompanimentSysId ===
                currentMashup.fields.accompanimentSysId ||
                lastMashup.fields.vocalsSysId ===
                  currentMashup.fields.vocalsSysId)
            ) {
              continue;
            } else {
              // Keep going unless 20 mashups selected or total duration is equal to or more than 28 minutes
              if (finalMashupArr.length < 20 && totalDuration <= 1680) {
                let pushed = 0;

                for (let j = 0; j < finalMashupArr.length; j++) {
                  const elExists = finalMashupArr[j];

                  if (!elExists) {
                    totalDuration += currentMashup.fields.duration;
                    finalMashupArr[j] = currentMashup;
                    pushed++;
                    break;
                  }
                }

                if (!pushed) {
                  totalDuration += currentMashup.fields.duration;
                  finalMashupArr.push(currentMashup);
                }
              } else {
                break;
              }
            }
          }

          return finalMashupArr;
        }
      }
    });
};

module.exports = { getMashupsForVideo };
