const timeStampToSeconds = (timestamp) => {
  if (timestamp) {
    const timeArr = timestamp.split(":").map((item) => Number(item));

    let totalSeconds = 0;

    totalSeconds += timeArr[0] * 3600;
    totalSeconds += timeArr[1] * 60;
    totalSeconds += timeArr[2];

    return totalSeconds;
  }
};

module.exports = timeStampToSeconds;
