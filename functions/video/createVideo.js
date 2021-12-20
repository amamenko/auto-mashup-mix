const { getMashupsForVideo } = require("./getMashupsForVideo");

const createVideo = async () => {
  const applicableMashups = await getMashupsForVideo();
};

module.exports = { createVideo };
