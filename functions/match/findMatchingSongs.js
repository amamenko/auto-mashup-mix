const keysArr = require("../arrays/keysArr");
const { timeStampToSeconds } = require("../utils/timeStampToSeconds");
const { getLongestContinuous } = require("./getLongestContinuous");
const { getNSectionMatchArr } = require("./getNSectionMatchArr");

const findMatchingSongs = (allSongs) => {
  const matches = [];

  for (const song1 of allSongs) {
    for (let i = 0; i < allSongs.length; i++) {
      const song2 = allSongs[i];

      const foundIndex = keysArr.findIndex((key) => key === song1.fields.key);

      // Potential key can be up to 1 semi-tone up or down
      const applicableArr = keysArr
        .slice(foundIndex - 1, foundIndex + 2)
        .map((item) => {
          const regex = /(-)|(\+)/gi;
          return item.replace(regex, "");
        });

      if (song1.sys.id !== song2.sys.id) {
        if (applicableArr.includes(song2.fields.key)) {
          const song1KeyIndex = applicableArr.findIndex(
            (key) => key === song1.fields.key
          );
          const song2KeyIndex = applicableArr.findIndex(
            (key) => key === song2.fields.key
          );
          const difference = Math.abs(song1KeyIndex - song2KeyIndex);
          const sign = song1KeyIndex - song2KeyIndex;

          if (
            song1.fields.title.toLowerCase() !==
            song2.fields.title.toLowerCase()
          ) {
            // If potential match is within +/- 5% of initial track
            if (
              song1.fields.tempo * 1.05 >= song2.fields.tempo &&
              song1.fields.tempo * 0.95 <= song2.fields.tempo
            ) {
              const matchExists = matches.find((el) => {
                const ids = [];

                for (const song in el) {
                  const obj = el[song];
                  ids.push(obj.sys.id);
                }
                if (ids[0] === song1.sys.id && ids[1] === song2.sys.id) {
                  return true;
                } else {
                  return false;
                }
              });

              if (!matchExists) {
                const noIntroOrOutro = (item) =>
                  item !== "intro" && item !== "outro";

                const song1Sections = song1.fields.sections
                  .map((section) =>
                    section.sectionName ? section.sectionName.split(" ")[0] : ""
                  )
                  .filter(noIntroOrOutro);
                const song2Sections = song2.fields.sections
                  .map((section) =>
                    section.sectionName ? section.sectionName.split(" ")[0] : ""
                  )
                  .filter(noIntroOrOutro);

                const bothSections = [
                  {
                    name: "song1",
                    sections: song1Sections,
                    continuousSections: [],
                  },
                  {
                    name: "song2",
                    sections: song2Sections,
                    continuousSections: [],
                  },
                ];

                const song1Obj = {
                  ...song1,
                  keyScaleFactor:
                    sign === 0
                      ? 1
                      : sign > 0
                      ? 1 - (1 / 12) * difference
                      : 1 + (1 / 12) * difference,
                  tempoScaleFactor: song2.fields.tempo / song1.fields.tempo,
                };

                const song2Obj = {
                  ...song2,
                  keyScaleFactor:
                    sign === 0
                      ? 1
                      : sign > 0
                      ? 1 + (1 / 12) * difference
                      : 1 - (1 / 12) * difference,
                  tempoScaleFactor: song1.fields.tempo / song2.fields.tempo,
                };

                const song1SectionsTimes = song1.fields.sections.map(
                  (section) => timeStampToSeconds(section.start)
                );
                const song2SectionsTimes = song2.fields.sections.map(
                  (section) => timeStampToSeconds(section.start)
                );

                const hasDuplicates = (array) =>
                  new Set(array).size !== array.length;

                const song1LongestContinuous = getLongestContinuous(song1);
                const song2LongestContinuous = getLongestContinuous(song2);

                bothSections[0].continuousSections =
                  song1LongestContinuous.sections;
                bothSections[1].continuousSections =
                  song2LongestContinuous.sections;

                const matchArr = getNSectionMatchArr(bothSections);

                if (
                  matchArr[0] &&
                  !hasDuplicates(song1SectionsTimes) &&
                  song1LongestContinuous.duration >= 80
                ) {
                  const newAccompanimentSections = matchArr[0].map((item) =>
                    song1Obj.fields.sections.find(
                      (section) => item === section.sectionName
                    )
                  );

                  matches.push({
                    accompaniment: {
                      ...song1Obj,
                      sections: newAccompanimentSections,
                    },
                    vocals: song2Obj,
                  });
                }

                if (
                  matchArr[1] &&
                  !hasDuplicates(song2SectionsTimes) &&
                  song2LongestContinuous.duration >= 80
                ) {
                  const newAccompanimentSections = matchArr[1].map((item) =>
                    song2Obj.fields.sections.find(
                      (section) => item === section.sectionName
                    )
                  );

                  matches.push({
                    accompaniment: {
                      ...song2Obj,
                      sections: newAccompanimentSections,
                    },
                    vocals: song1Obj,
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  return matches;
};

module.exports = { findMatchingSongs };
