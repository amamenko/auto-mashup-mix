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
    .then(async (res) => {
      if (res) {
        if (res.items && res.items.length > 0) {
          let totalDuration = 0;
          const finalMashupArr = [];

          // Get random 80 approved mashups
          let mashups = sampleSize(res.items, 80);

          const mixListEntries = await client.getEntries({
            content_type: "mixList",
          });

          const mixLists = mixListEntries.items
            .map((item) => item.fields.mashups)
            .flat();

          const mixListIDs = mixLists.map((item) => {
            return {
              vocalsID: item.vocalsID,
              accompanimentID: item.accompanimentID,
            };
          });

          mashups = mashups.filter((mashup) =>
            mixListIDs.find(
              (ids) =>
                mashup.fields.vocalsSysId === ids.vocalsID &&
                mashup.fields.accompanimentSysId === ids.accompanimentID
            )
          );

          const lastVideoEntry = await client.getEntries({
            content_type: "video",
          });

          const latestVideoFields = lastVideoEntry.items[0].fields;

          if (latestVideoFields) {
            const latestVideoMashups = latestVideoFields.latestMashups;
            if (latestVideoMashups) {
              const allVox = latestVideoMashups.map((item) =>
                item ? item.vocalsTitle + " " + item.vocalsArtist : ""
              );

              const allAccompaniments = latestVideoMashups.map((item) =>
                item
                  ? item.accompanimentTitle + " " + item.accompanimentArtist
                  : ""
              );

              mashups = mashups.filter(
                (mashup) =>
                  // WMG blocks YouTube videos with "Wonderwall" vox
                  mashup.fields.vocalsTitle !== "Wonderwall" &&
                  !allVox.includes(
                    mashup.fields.vocalsTitle + " " + mashup.fields.vocalsArtist
                  ) &&
                  !allAccompaniments.includes(
                    mashup.fields.accompanimentTitle +
                      " " +
                      mashup.fields.accompanimentArtist
                  )
              );
            }
          }

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

          const vocalsArr = [];
          const instrumentalsArr = [];

          for (let i = 0; i < mashups.length; i++) {
            const currentMashup = mashups[i];
            const lastMashup = mashups[i - 1];
            const penultimateMashup = mashups[i - 2];

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
              if (
                penultimateMashup &&
                (penultimateMashup.fields.accompanimentSysId ===
                  currentMashup.fields.accompanimentSysId ||
                  penultimateMashup.fields.vocalsSysId ===
                    currentMashup.fields.vocalsSysId)
              ) {
                continue;
              } else {
                if (
                  !finalMashupArr.some(
                    (mashup) =>
                      mashup.fields.accompanimentSysId ===
                        currentMashup.fields.accompanimentSysId &&
                      mashup.fields.vocalsSysId ===
                        currentMashup.fields.vocalsSysId
                  )
                ) {
                  if (finalMashupArr.length < 20 && totalDuration <= 1680) {
                    // Keep going unless 20 mashups selected or total duration is equal to or more than 28 minutes
                    let pushed = 0;

                    for (let j = 0; j < finalMashupArr.length; j++) {
                      const elExists = finalMashupArr[j];

                      if (!elExists) {
                        totalDuration +=
                          currentMashup.fields.mixEnd -
                          currentMashup.fields.mixStart -
                          5;
                        finalMashupArr[j] = currentMashup;
                        pushed++;
                        break;
                      }
                    }

                    if (!pushed) {
                      const vocalsTitleArtist =
                        currentMashup.fields.vocalsTitle +
                        " " +
                        currentMashup.fields.vocalsArtist;
                      const accompanimentTitleArtist =
                        currentMashup.fields.accompanimentTitle +
                        " " +
                        currentMashup.fields.accompanimentArtist;

                      if (
                        !vocalsArr.find((item) => item === vocalsTitleArtist) &&
                        !instrumentalsArr.find(
                          (item) => item === accompanimentTitleArtist
                        )
                      ) {
                        totalDuration +=
                          currentMashup.fields.mixEnd -
                          currentMashup.fields.mixStart -
                          5;

                        vocalsArr.push(vocalsTitleArtist);

                        instrumentalsArr.push(accompanimentTitleArtist);

                        finalMashupArr.push(currentMashup);
                      }
                    }
                  } else {
                    break;
                  }
                } else {
                  continue;
                }
              }
            }
          }

          return finalMashupArr.filter(
            (value, index, self) =>
              index ===
              self.findIndex(
                (t) =>
                  t.fields.accompanimentSysId ===
                    value.fields.accompanimentSysId &&
                  t.fields.vocalsSysId === value.fields.vocalsSysId
              )
          );
        }
      }
    });
};

module.exports = { getMashupsForVideo };
