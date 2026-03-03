/** Max allowed length for a player name */
export const MAX_NAME_LENGTH = 20;

/** Control characters: C0, C1, zero-width, and BOM */
const CONTROL_CHAR_PATTERN =
  "[\\u0000-\\u001F\\u007F-\\u009F\\u200B-\\u200F\\u2028-\\u202F\\uFEFF]";

const HAS_CONTROL_CHARS = new RegExp(CONTROL_CHAR_PATTERN);
const HAS_DISALLOWED_CHARS = /[^a-zA-Z0-9 '\-.]/;

/**
 * Returns an error message if the input contains invalid characters
 * or exceeds the max length, or null if valid.
 */
export function validateName(raw: string): string | null {
  if (HAS_CONTROL_CHARS.test(raw)) return "Name contains invalid characters";
  if (HAS_DISALLOWED_CHARS.test(raw))
    return "Only letters, numbers, spaces, hyphens, and periods allowed";
  if (raw.length > MAX_NAME_LENGTH) return `Name must be ${MAX_NAME_LENGTH} characters or less`;
  return null;
}
