import type { Option } from "types/option";

/**
 * Filters options by matching the query against the start of any word in the
 * option's name (case-insensitive). Results are ranked with full-name prefix
 * matches first, then word-boundary matches.
 *
 * @param options - The full list of available options to search through.
 * @param query - The raw user input. Trimmed and lowercased internally.
 *   Empty queries return an empty array.
 * @returns A ranked array of matching options — prefix matches first, then
 *   word-boundary matches.
 */
export function filterOptions(options: Option[], query: string): Option[] {
  const normalized = query.trim().toLowerCase();

  if (normalized.length < 1) return [];

  const prefixMatches: Option[] = [];
  const wordMatches: Option[] = [];

  for (const o of options) {
    const name = o.name.toLowerCase();
    if (name.startsWith(normalized)) {
      prefixMatches.push(o);
    } else if (name.split(" ").some((word) => word.startsWith(normalized))) {
      wordMatches.push(o);
    }
  }

  return [...prefixMatches, ...wordMatches];
}
