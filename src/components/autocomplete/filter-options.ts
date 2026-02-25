import type { Option } from "types/option";

const MAX_RESULTS = 8;

/**
 * Filters a list of options by matching the query against the start of each
 * option's name (case-insensitive). Returns up to {@link MAX_RESULTS} matches.
 *
 * @param options - The full list of available options to search through.
 * @param query - The raw user input. Trimmed and lowercased internally.
 *   Empty queries return an empty array.
 * @returns A filtered array of options whose names start with the query,
 *   capped at {@link MAX_RESULTS}.
 */
export function filterOptions(options: Option[], query: string): Option[] {
  const normalized = query.trim().toLowerCase();

  if (normalized.length < 1) return [];

  return options.filter((o) => o.name.toLowerCase().startsWith(normalized)).slice(0, MAX_RESULTS);
}
