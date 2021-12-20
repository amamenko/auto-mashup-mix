const { format, startOfWeek } = require("date-fns");

const getMostRecentSaturday = () => {
  const upcomingSaturday = format(
    startOfWeek(new Date(), {
      weekStartsOn: 6,
    }),
    "yyyy-MM-dd"
  );

  return upcomingSaturday;
};

module.exports = { getMostRecentSaturday };
