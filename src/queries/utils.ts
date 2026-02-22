export async function handleError(api: string, response: Response) {
  const errorText = await response.text();
  throw new Error(`${api} API error (${response.status}): ${errorText || response.statusText}`);
}

const TWENTY_FOUR_HOURS = 1000 * 60 * 60 * 24;

/** Default stale time for the QueryClient. */
export const DEFAULT_STALE_TIME = TWENTY_FOUR_HOURS;

/** Past years never change — cache forever. Current year refetches every 24 hours. */
export const getStaleTime = (year: string) =>
  parseInt(year, 10) < new Date().getFullYear() ? Infinity : TWENTY_FOUR_HOURS;
