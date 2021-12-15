const { format, startOfWeek, addDays } = require("date-fns");

const getUpcomingSaturday = () => {
  const upcomingSaturday = format(
    addDays(
      startOfWeek(new Date(), {
        weekStartsOn: 6,
      }),
      7
    ),
    "yyyy-MM-dd"
  );

  return upcomingSaturday;
};

module.exports = { getUpcomingSaturday };
