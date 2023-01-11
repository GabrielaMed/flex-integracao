export const getDateTimeFromString = (str) => {
  if (!str) return new Date();

  const [dateValues, timeValues] = str.split(" ");

  const [day, month, year] = dateValues.split("/");

  const [hours, minutes, seconds] = timeValues.split(":");

  return new Date(
    +year,
    +month - 1,
    +day,
    +hours + Number(process.env.UTC_TIME_ZONE || 0),
    +minutes,
    +seconds,
    0
  );
};

export const getDateTimeNow = () => {
  const str = new Date().toLocaleString();

  const [dateValues, timeValues] = str.split(" ");

  const [day, month, year] = dateValues.split("/");

  const [hours, minutes, seconds] = timeValues.split(":");

  return new Date(
    +year,
    +month - 1,
    +day,
    +hours + Number(process.env.UTC_TIME_ZONE || 0),
    +minutes,
    +seconds,
    0
  );
};
