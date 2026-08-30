const START_YEAR = 1987;

export function currentYear(yearString: string) {
  const year = parseInt(yearString, 10);
  if (isNaN(year) || year < START_YEAR || year > new Date().getFullYear())
    // internal: plain Error — year is validated by the arg validator upstream
    throw new Error("Invalid year");
  const startDate = new Date(year, 0, 1).getTime() / 1000;
  const endDate = new Date(year + 1, 0, 1).getTime() / 1000;

  return {
    year,
    startDate,
    endDate,
  };
}
