const timeStampToSeconds = require("../utils/timeStampToSeconds");

const getLongestContinuous = (song) => {
  const noIntroOrOutro = (item) => item !== "intro" && item !== "outro";

  const songExpected = song.fields.expectedSections
    ? song.fields.expectedSections.split(", ")
    : [];

  const songActual = song.fields.sections
    .map((section) => section.sectionName)
    .filter(noIntroOrOutro);

  const songDeviations = songExpected.filter(
    (item) => !songActual.includes(item)
  );
  const allSongContinousSections = [];
  let currentSongArr = [];

  for (let i = 0; i < songExpected.length; i++) {
    const currentSection = songExpected[i];

    if (songDeviations.includes(currentSection)) {
      if (currentSongArr.length > 0) {
        allSongContinousSections.push(currentSongArr);
        currentSongArr = [];
      }
    } else {
      currentSongArr.push(currentSection);

      // If last iteration
      if (i === songActual.length - 1) {
        allSongContinousSections.push(currentSongArr);
        currentSongArr = [];
      }
    }
  }

  const allSongContinuousLengths = allSongContinousSections.map(
    (arr) => arr.length
  );

  const songLongestContinous = allSongContinousSections.find(
    (arr) => arr.length === Math.max(...allSongContinuousLengths)
  );

  const songContinousFirstSection = song.fields.sections.find(
    (section) => section.sectionName === songLongestContinous[0]
  );

  const songContinousLastSection = song.fields.sections.find(
    (section) =>
      section.sectionName ===
      songLongestContinous[songLongestContinous.length - 1]
  );

  if (songContinousLastSection.start && songContinousFirstSection.start) {
    const songLongestContinuousSectionDuration =
      timeStampToSeconds(songContinousLastSection.start) -
      timeStampToSeconds(songContinousFirstSection.start);

    return {
      sections: songLongestContinous,
      duration: songLongestContinuousSectionDuration,
    };
  } else {
    return {
      sections: [],
      duration: 0,
    };
  }
};

module.exports = getLongestContinuous;
