const START_YEAR = 1987;

/**
 * The year arg as a number, rejecting anything outside the range the year picker
 * offers. Every option action runs this before it builds a cache key or a
 * third-party URL, so the key space stays bounded and nothing caller-controlled
 * reaches the URL.
 */
export function parseYear(yearString: string) {
  const year = parseInt(yearString, 10);
  if (isNaN(year) || year < START_YEAR || year > new Date().getFullYear())
    // internal: plain Error — nothing user-actionable; the picker only offers valid years
    throw new Error("Invalid year");

  return year;
}

export function currentYear(yearString: string) {
  const year = parseYear(yearString);
  const startDate = new Date(year, 0, 1).getTime() / 1000;
  const endDate = new Date(year + 1, 0, 1).getTime() / 1000;

  return {
    year,
    startDate,
    endDate,
  };
}
