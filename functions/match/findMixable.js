const contentful = require("contentful");
const { generateSongImage } = require("../images/generateSongImage");
const normalizeInputsAndMix = require("../mix/normalizeInputsAndMix");
const findMatchingSongs = require("./findMatchingSongs");

const findMixable = async () => {
  const client = contentful.createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
  });

  await client
    .getEntries({
      "fields.mode": "major",
      select:
        "fields.title,fields.artist,fields.tempo,fields.key,fields.mode,fields.duration,fields.expectedSections,fields.sections,fields.cover,fields.charts,fields.beats,fields.accompaniment,fields.vocals",
      content_type: "song",
      limit: 1000,
    })
    .then((res) => {
      if (res) {
        if (res.items) {
          const matches = findMatchingSongs(res.items);

          const makeBeatArr = (str) => {
            return [...str.split(", ").map((item) => Number(item))];
          };

          let matchArr = matches.map((item) => {
            return {
              accompaniment: {
                ...item.accompaniment.fields,
                sections: item.accompaniment.sections,
                beats: makeBeatArr(item.accompaniment.fields.beats),
                keyScaleFactor: item.accompaniment.keyScaleFactor,
                tempoScaleFactor: item.accompaniment.tempoScaleFactor,
              },
              vocals: {
                ...item.vocals.fields,
                beats: makeBeatArr(item.vocals.fields.beats),
                keyScaleFactor: item.vocals.keyScaleFactor,
                tempoScaleFactor: item.vocals.tempoScaleFactor,
              },
            };
          });

          const list = matchArr.map((item) => JSON.stringify(item));
          const uniqueList = new Set(list);
          matchArr = Array.from(uniqueList).map((item) => JSON.parse(item));

          if (matchArr && matchArr.length > 0) {
            console.log(matchArr.length);

            if (matchArr[0]) {
              generateSongImage(matchArr[0].accompaniment, matchArr[0].vocals);
            }
          }
        }
      }
    });
};

module.exports = findMixable;
