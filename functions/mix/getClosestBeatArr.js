const timeStampToSeconds = require("../utils/timeStampToSeconds");

const findClosestBeat = (seconds, song) => {
  const beats = song.beats;

  const closest = beats.reduce((a, b) => {
    return Math.abs(b - seconds) < Math.abs(a - seconds) ? b : a;
  });
  const indexClosest = beats.findIndex((item) => item === closest);

  return beats[indexClosest + 1];
};

function getClosestBeatArr(section, index, arr) {
  const song = this;
  const nextSection = arr[index + 1];
  const startTime = findClosestBeat(timeStampToSeconds(section.start), song);
  const nextSectionStartTime = nextSection
    ? findClosestBeat(timeStampToSeconds(nextSection.start), song)
    : song.duration;

  return {
    start: startTime,
    duration: nextSectionStartTime - startTime,
    sectionName: section.sectionName,
  };
}

module.exports = getClosestBeatArr;
