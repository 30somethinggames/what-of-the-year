export function currentYear(yearString: string) {
  const year = parseInt(yearString, 10);
  const startDate = new Date(year, 0, 1).getTime() / 1000;
  const endDate = new Date(year + 1, 0, 1).getTime() / 1000;

  return {
    year,
    startDate,
    endDate,
  };
}
