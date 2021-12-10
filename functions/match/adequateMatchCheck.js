const {
  verseSections,
  refrainSections,
  preChorusSections,
  chorusSections,
  postChorusSections,
  bridgeSections,
  spokenSections,
} = require("../arrays/songSectionsArr");

const adequateMatchCheck = (currentSongSections, otherSongSections) => {
  const acceptableSections = [];

  for (let j = 0; j < currentSongSections.length; j++) {
    for (let k = 0; k < currentSongSections[j].length; k++) {
      const current = currentSongSections[k];
      const generalSections = current
        ? current.map((section) => section.split(" ")[0])
        : [];

      if (
        current &&
        generalSections.length > 0 &&
        !current.includes("intro 1") &&
        !current.includes("intro 2") &&
        !current.includes("outro 1")
      ) {
        let applicableSongsSectionsArr = [
          verseSections,
          refrainSections,
          preChorusSections,
          chorusSections,
          postChorusSections,
          bridgeSections,
          spokenSections,
        ];

        let noMatch = 0;

        for (let l = 0; l < applicableSongsSectionsArr.length; l++) {
          for (let m = 0; m < generalSections.length; m++) {
            if (applicableSongsSectionsArr[l].includes(generalSections[m])) {
              if (otherSongSections) {
                if (
                  applicableSongsSectionsArr[l].some((item) =>
                    otherSongSections.includes(item)
                  )
                ) {
                  continue;
                } else {
                  noMatch++;
                }
              }
            }
          }
        }

        if (noMatch === 0) {
          acceptableSections.push(current);
        }
      }
    }
  }

  return acceptableSections;
};

module.exports = { adequateMatchCheck };
