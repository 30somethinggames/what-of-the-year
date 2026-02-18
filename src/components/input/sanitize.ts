/** Max allowed length for a player name */
export const MAX_NAME_LENGTH = 20;

/**
 * Allowlist: letters, numbers, spaces, hyphens, apostrophes, periods.
 * Everything else is stripped.
 */
const ALLOWED_CHARS = /[^a-zA-Z0-9 '\-.]/g;

/** Control characters: C0, C1, zero-width, and BOM */
const CONTROL_CHAR_PATTERN =
  "[\\u0000-\\u001F\\u007F-\\u009F\\u200B-\\u200F\\u2028-\\u202F\\uFEFF]";

const CONTROL_CHARS = new RegExp(CONTROL_CHAR_PATTERN, "g");
const HAS_CONTROL_CHARS = new RegExp(CONTROL_CHAR_PATTERN);
const HAS_DISALLOWED_CHARS = /[^a-zA-Z0-9 '\-.]/;

/**
 * Returns an error message if the raw input contains characters
 * that will be stripped by sanitizeName, or null if valid.
 */
export function validateName(raw: string): string | null {
  if (HAS_CONTROL_CHARS.test(raw)) return "Name contains invalid characters";
  if (HAS_DISALLOWED_CHARS.test(raw))
    return "Only letters, numbers, spaces, hyphens, and periods allowed";
  if (raw.length > MAX_NAME_LENGTH) return `Name must be ${MAX_NAME_LENGTH} characters or less`;
  return null;
}

/**
 * Sanitizes a player name:
 * 1. Strips control / zero-width characters
 * 2. Strips characters outside the allowlist
 * 3. Collapses consecutive spaces
 * 4. Trims leading/trailing whitespace
 * 5. Enforces max length
 */
export function sanitizeName(raw: string): string {
  return raw
    .replace(CONTROL_CHARS, "")
    .replace(ALLOWED_CHARS, "")
    .replace(/\s{2,}/g, " ")
    .trimStart()
    .slice(0, MAX_NAME_LENGTH);
}
