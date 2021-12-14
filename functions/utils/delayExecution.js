const delayExecution = (ms) =>
  new Promise((resolve, reject) => {
    setTimeout((item) => resolve(), ms);
  });

module.exports = { delayExecution };
