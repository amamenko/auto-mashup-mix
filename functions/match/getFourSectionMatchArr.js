const { adequateMatchCheck } = require("./adequateMatchCheck");

const getFourSectionMatchArr = (bothSections) => {
  const matchArr = [];

  for (let j = 0; j < bothSections.length; j++) {
    const currentName = bothSections[j].name;

    const currentSection = bothSections[j];
    const otherSection = bothSections.find((item) => item.name !== currentName);

    const getEveryFour = (sectionArr) => {
      const everyFour = [];

      for (let k = 0; k < sectionArr.length; k++) {
        const currentFourSlice = sectionArr.slice(k, k + 4);

        if (
          currentFourSlice.length === 4 &&
          !currentFourSlice.includes("intro 1") &&
          !currentFourSlice.includes("intro 2") &&
          !currentFourSlice.includes("outro")
        ) {
          everyFour.push(currentFourSlice);
        }
      }

      return everyFour;
    };

    const sectionMatches = adequateMatchCheck(
      getEveryFour(currentSection.continuousSections),
      otherSection.sections
    );

    matchArr.push(sectionMatches[0]);
  }

  return matchArr;
};

module.exports = { getFourSectionMatchArr };
