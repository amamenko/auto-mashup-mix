const { timeStampToSeconds } = require("../utils/timeStampToSeconds");

const findClosestBeat = (seconds, song) => {
  let beats = song.beats ? song.beats : song.fields.beats;

  if (typeof beats === "string") {
    beats = beats.split(", ");
  }

  const closest = beats.reduce((a, b) => {
    return Math.abs(b - seconds) < Math.abs(a - seconds) ? b : a;
  });
  const indexClosest = beats.findIndex((item) => item === closest);

  if (song.currentSection === "vocals") {
    return beats[indexClosest + 5];
  } else {
    return beats[indexClosest + 1];
  }
};

function getClosestBeatArr(section, index, arr) {
  const song = this;
  const nextSection = arr[index + 1];
  const startTime = findClosestBeat(timeStampToSeconds(section.start), song);
  const nextSectionStartTime = nextSection
    ? findClosestBeat(timeStampToSeconds(nextSection.start), song)
    : song.duration
    ? song.duration
    : song.fields.duration;

  return {
    start: startTime,
    duration: nextSectionStartTime - startTime,
    sectionName: section.sectionName,
  };
}

module.exports = { getClosestBeatArr };
