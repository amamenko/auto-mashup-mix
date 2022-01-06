const {
  introSections,
  verseSections,
  refrainSections,
  preChorusSections,
  chorusSections,
  postChorusSections,
  bridgeSections,
  outroSections,
} = require("../arrays/songSectionsArr");
const removeAccents = require("remove-accents");
const { getClosestBeatArr } = require("./getClosestBeatArr");

const createComplexFilter = (instrumentals, vox) => {
  const vocalsKeyScale = vox.keyScaleFactor;
  const vocalsTempoScale = vox.tempoScaleFactor;

  // Apply BPM adjustment matching to original BPM of vocal track
  if (vox.beats) {
    if (typeof vox.beats === "string") {
      vox.beats = vox.beats
        .split(", ")
        .map((beat) => (1 / vocalsTempoScale) * Number(beat));
    } else {
      vox.beats = vox.beats.map((beat) => (1 / vocalsTempoScale) * beat);
    }
  } else {
    vox.fields.beats = vox.fields.beats
      .split(", ")
      .map((beat) => (1 / vocalsTempoScale) * Number(beat));
  }

  instrumentals.currentSection = "accompaniment";

  let instrumentalSections = instrumentals.sections.map(
    getClosestBeatArr,
    instrumentals.duration ? instrumentals : instrumentals.fields
  );
  const mixStart = instrumentalSections[0].start;
  const mixLastSectionIndex = instrumentalSections.findIndex(
    (section) => section.start - mixStart >= 75
  );

  if (mixLastSectionIndex >= -1) {
    instrumentalSections = instrumentalSections.slice(0, mixLastSectionIndex);
  }

  vox.currentSection = "vocals";

  const voxSections = vox.sections ? vox.sections : vox.fields.sections;
  const vocalSections = voxSections.map(
    getClosestBeatArr,
    vox.duration ? vox : vox.fields
  );
  const voxNameSections = voxSections.map((item) => item.sectionName);

  let matchedVocalSections = instrumentalSections.map((instrumentalSection) => {
    if (instrumentalSection) {
      const name = instrumentalSection.sectionName.split(" ")[0];
      const number = instrumentalSection.sectionName.split(" ")[1];

      function closestMatch(section) {
        const generalSection = JSON.parse(this);
        const voxSectionName = section.sectionName.split(" ")[0];
        const voxSectionNumber = section.sectionName.split(" ")[1];

        if (generalSection.includes(voxSectionName)) {
          if (number === voxSectionNumber) {
            return true;
          } else {
            if (voxNameSections.includes(voxSectionName + " " + number)) {
              return false;
            } else {
              return true;
            }
          }
        }
      }

      if (introSections.includes(name)) {
        return {
          ...vocalSections.find(closestMatch, JSON.stringify(introSections)),
          instrumentalSection,
        };
      } else if (verseSections.includes(name)) {
        return {
          ...vocalSections.find(closestMatch, JSON.stringify(verseSections)),
          instrumentalSection,
        };
      } else if (refrainSections.includes(name)) {
        return {
          ...vocalSections.find(closestMatch, JSON.stringify(refrainSections)),
          instrumentalSection,
        };
      } else if (preChorusSections.includes(name)) {
        return {
          ...vocalSections.find(
            closestMatch,
            JSON.stringify(preChorusSections)
          ),
          instrumentalSection,
        };
      } else if (chorusSections.includes(name)) {
        return {
          ...vocalSections.find(closestMatch, JSON.stringify(chorusSections)),
          instrumentalSection,
        };
      } else if (postChorusSections.includes(name)) {
        return {
          ...vocalSections.find(
            closestMatch,
            JSON.stringify(postChorusSections)
          ),
          instrumentalSection,
        };
      } else if (bridgeSections.includes(name)) {
        return {
          ...vocalSections.find(closestMatch, JSON.stringify(bridgeSections)),
          instrumentalSection,
        };
      } else if (outroSections.includes(name)) {
        return {
          ...vocalSections.find(closestMatch, JSON.stringify(outroSections)),
          instrumentalSection,
        };
      } else {
        return;
      }
    }
  });

  matchedVocalSections = matchedVocalSections.filter((item) => {
    if (item) {
      return (
        item.sectionName &&
        item.start &&
        item.duration &&
        item.instrumentalSection.sectionName &&
        item.instrumentalSection.start &&
        item.instrumentalSection.duration
      );
    }
  });

  const trimmedSections = matchedVocalSections.map((section, i, arr) => {
    const currentIndex = vocalSections.findIndex(
      (item) => item.sectionName === section.sectionName
    );
    const nextSection = vocalSections[currentIndex + 1];

    const instrumentalSection = section.instrumentalSection;
    const delay = instrumentalSection.start;
    const startTime = section.start;

    let endTime = 0;

    if (nextSection) {
      if (nextSection.start) {
        endTime = nextSection.start;
      } else {
        if (vox.duration) {
          endTime = vox.duration;
        } else {
          if (vox.fields) {
            if (vox.fields.duration) {
              endTime = vox.fields.duration;
            }
          }
        }
      }
    } else {
      if (vox.duration) {
        endTime = vox.duration;
      } else {
        if (vox.fields) {
          if (vox.fields.duration) {
            endTime = vox.fields.duration;
          }
        }
      }
    }

    const defaultDuration = Math.max(0, endTime - startTime);
    const maxDuration =
      Math.abs(instrumentalSection.duration - (endTime - startTime)) <= 5
        ? Math.min(instrumentalSection.duration, endTime - startTime)
        : instrumentalSection.duration;

    if (defaultDuration > maxDuration) {
      endTime = startTime + maxDuration;
    }

    const ffmpegSectionName = `${removeAccents(
      instrumentalSection.sectionName
    )}`.replace(" ", ":");

    const relativeDelay = delay * 1000;

    const duration = endTime - startTime;

    const numberOfLoops =
      maxDuration <= duration
        ? 0
        : Math.max(Math.round(maxDuration / duration) - 1, 1);

    const voxBeats = vox.beats ? vox.beats : vox.fields.beats;
    const currentBeatsIndex = voxBeats.findIndex(
      (beat) => beat === section.start
    );
    const eightMeasuresAfterStart = voxBeats[currentBeatsIndex + 32];
    const fourMeasuresAfterStart = voxBeats[currentBeatsIndex + 16];

    let loopTime = 0;

    if (eightMeasuresAfterStart) {
      if (eightMeasuresAfterStart >= section.start) {
        loopTime = eightMeasuresAfterStart - section.start;
      } else {
        if (fourMeasuresAfterStart) {
          if (fourMeasuresAfterStart >= section.start) {
            loopTime = fourMeasuresAfterStart - section.start;
          }
        }
      }
    } else {
      if (fourMeasuresAfterStart) {
        if (fourMeasuresAfterStart >= section.start) {
          loopTime = fourMeasuresAfterStart - section.start;
        }
      }
    }

    return [
      {
        filter: `atrim=start=${startTime}:end=${endTime}`,
        inputs: `vox:${i + 1}`,
        outputs: ffmpegSectionName,
      },
      {
        filter: "asetpts=PTS-STARTPTS",
        inputs: ffmpegSectionName,
        outputs: `${ffmpegSectionName}_pts`,
      },
      {
        filter: `${
          numberOfLoops > 0
            ? `afade=enable='between(t,0,2)':t=in:st=0:d=2,afade=enable='between(t,${Math.max(
                loopTime <= duration ? loopTime - 2 : duration - 2,
                0
              )},${Math.max(
                loopTime <= duration ? loopTime : duration,
                0
              )})':t=out:st=${Math.max(
                loopTime <= duration ? loopTime - 2 : duration - 2,
                0
              )}:d=2,`
            : ""
        }aloop=loop=${numberOfLoops === 0 ? 0 : 10}:size=${
          loopTime <= duration ? loopTime * 44100 : duration * 44100
        }:start=0`,
        inputs: `${ffmpegSectionName}_pts`,
        outputs: `loop${i + 1}`,
      },
      {
        filter: `atrim=duration=${maxDuration}`,
        inputs: `loop${i + 1}`,
        outputs: `loop${i + 1}_pts_trim`,
      },
      {
        filter: "asetpts=PTS-STARTPTS",
        inputs: `loop${i + 1}_pts_trim`,
        outputs: `loop${i + 1}_pts_trim_pts`,
      },
      {
        filter:
          numberOfLoops === 0
            ? `afade=enable='between(t,0,${i === 0 ? 5 : 1})':t=in:st=0:d=${
                i === 0 ? 5 : 1
              },afade=enable='between(t,${
                maxDuration - (i === arr.length - 1 ? 5 : 1)
              },${maxDuration})':t=out:st=${
                maxDuration - (i === arr.length - 1 ? 5 : 1)
              }:d=${i === arr.length - 1 ? 5 : 1}`
            : "anull",
        inputs: `loop${i + 1}_pts_trim_pts`,
        outputs: `${ffmpegSectionName}_fade`,
      },
      {
        filter: `afade=t=out:st=${maxDuration - 2}:d=2`,
        inputs: `${ffmpegSectionName}_fade`,
        outputs: `${ffmpegSectionName}_fade_again`,
      },
      {
        filter: "loudnorm=tp=-7:i=-28",
        inputs: `${ffmpegSectionName}_fade_again`,
        outputs: `${ffmpegSectionName}_normalized`,
      },
      {
        filter: `adelay=${relativeDelay}|${relativeDelay}`,
        inputs: `${ffmpegSectionName}_normalized`,
        outputs: `${ffmpegSectionName}_delayed`,
      },
    ];
  });

  const voxOutputNamesArr = trimmedSections.map(
    (item) => item[item.length - 1].outputs
  );

  const getRubberbandFilter = (num) => {
    const audioInputNum = num + 1;

    return [
      // Push the vocal volume up for vox
      {
        filter: "volume=2.85",
        inputs: `${audioInputNum}:a`,
        outputs: `${audioInputNum}_louder:a`,
      },
      {
        filter: `rubberband=pitch=${vocalsKeyScale}:tempo=${vocalsTempoScale}:formant=preserved`,
        inputs: `${audioInputNum}_louder:a`,
        outputs: `vox:${audioInputNum}`,
      },
    ];
  };

  const rubberbandFiltersArr = [...Array(instrumentals.sections.length).keys()]
    .map(getRubberbandFilter)
    .slice(0, trimmedSections.length);

  const complexFilter = [
    // Normalize instrumental audio
    {
      filter: "loudnorm=tp=-9:i=-33",
      inputs: "0:a",
      outputs: "0:a:normalized",
    },
    // Apply vocal pitching / tempo scaling adjustments
    ...rubberbandFiltersArr.flat(),
    // Apply section trimming and appropriate time delays to vox
    ...trimmedSections.flat(),
    // Mix instrumentals and pitched vocal sections together
    {
      filter: `amix=inputs=${1 + matchedVocalSections.length}:duration=first`,
      inputs: ["0:a:normalized", ...voxOutputNamesArr],
    },
  ];

  return complexFilter;
};

module.exports = { createComplexFilter };
