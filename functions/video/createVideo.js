const { getMashupImagesAndAudio } = require("./getMashupImagesAndAudio");
const { getMashupsForVideo } = require("./getMashupsForVideo");

const createVideo = async () => {
  const applicableMashups = await getMashupsForVideo();

  const allPromises = [];

  for (let i = 0; i < applicableMashups.length; i++) {
    const currentPromise = getMashupImagesAndAudio(applicableMashups[i], i);
    allPromises.push(currentPromise);
  }

  Promise.all(allPromises.map((p) => p.catch((error) => null)))
    .then(() => {
      console.log("All promises have been resolved!");
    })
    .catch((err) => console.error(err));
};

module.exports = { createVideo };
