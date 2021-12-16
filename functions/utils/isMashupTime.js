const { format } = require("date-fns");
const { timeStampToSeconds } = require("./timeStampToSeconds");

const isMashupTime = () => {
  const dayAndTime = format(new Date(), "E HH:mm:ss");
  const dayTimeArr = dayAndTime.split(" ");
  const currentDay = dayTimeArr[0];
  const currentTimeStamp = dayTimeArr[1];

  if (currentDay === "Sun") {
    if (
      timeStampToSeconds(currentTimeStamp) >= timeStampToSeconds("08:00:00")
    ) {
      return true;
    }
  } else {
    if (currentDay === "Mon") {
      if (
        timeStampToSeconds(currentTimeStamp) < timeStampToSeconds("12:00:00")
      ) {
        return true;
      }
    }
  }
};

module.exports = { isMashupTime };
