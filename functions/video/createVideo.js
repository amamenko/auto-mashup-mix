const { createMixOfAllMashups } = require("../mix/createMixOfAllMashups");
const { checkExistsAndDelete } = require("../utils/checkExistsAndDelete");
const { createSlideshow } = require("./createSlideshow");
const { getMashupImagesAndAudio } = require("./getMashupImagesAndAudio");
const { getMashupsForVideo } = require("./getMashupsForVideo");

const createVideo = async () => {
  const applicableMashups = await getMashupsForVideo();

  const allPromises = [];

  console.log(
    "Got all applicable mashups for this week! Now getting applicable song profile images and mashup audio..."
  );
  for (let i = 0; i < applicableMashups.length; i++) {
    const currentPromise = getMashupImagesAndAudio(applicableMashups[i], i);
    allPromises.push(currentPromise);
  }

  Promise.all(allPromises.map((p) => p.catch((error) => null)))
    .then(async () => {
      console.log(
        "All mashup image/audio promises have been resolved! Creating full mashup audio mix now!"
      );
      await createMixOfAllMashups().then(() => {
        console.log(
          "Full mashup audio mix successfully created! Creating slideshow video now!"
        );
        createSlideshow();
      });
    })
    .catch(async (err) => {
      console.error(err);
      await checkExistsAndDelete("video_audio");
      await checkExistsAndDelete("video_images");
    });
};

module.exports = { createVideo };
