const { adequateMatchCheck } = require("./adequateMatchCheck");

const getNSectionMatchArr = (bothSections) => {
  const matchArr = [];

  for (let j = 0; j < bothSections.length; j++) {
    const currentName = bothSections[j].name;

    const currentSection = bothSections[j];
    const otherSection = bothSections.find((item) => item.name !== currentName);

    const getEveryN = (sectionArr, n) => {
      const everyN = [];

      for (let k = 0; k < sectionArr.length; k++) {
        const currentNSlice = sectionArr.slice(k, k + n);

        if (
          currentNSlice.length === n &&
          !currentNSlice.includes("intro 1") &&
          !currentNSlice.includes("intro 2") &&
          !currentNSlice.includes("outro")
        ) {
          everyN.push(currentNSlice);
        }
      }

      return everyN;
    };

    const findAllMatches = (n) => {
      return adequateMatchCheck(
        getEveryN(currentSection.continuousSections, n),
        otherSection.sections
      );
    };

    let sectionMatches = [];

    // Most possible matches sections is 8, least possible is 4
    for (let i = 8; i > 3; i--) {
      sectionMatches = findAllMatches(i);

      if (sectionMatches.length === 0) {
        continue;
      } else {
        break;
      }
    }

    matchArr.push(sectionMatches[0]);
  }

  return matchArr;
};

module.exports = { getNSectionMatchArr };
