import { describe, expect, it } from "bun:test";

import { MAX_NAME_LENGTH, validateName } from "../sanitize";

describe("validateName", () => {
  it("returns null for valid names", () => {
    expect(validateName("Ryan")).toBeNull();
    expect(validateName("O'Brien-Jr.")).toBeNull();
    expect(validateName("Player 1")).toBeNull();
  });

  it("returns error for control characters", () => {
    expect(validateName("Ryan\u0000")).toBe("Name contains invalid characters");
    expect(validateName("A\u200B")).toBe("Name contains invalid characters");
  });

  it("returns error for disallowed characters", () => {
    expect(validateName("<script>")).toBe(
      "Only letters, numbers, spaces, hyphens, and periods allowed",
    );
    expect(validateName("name!")).toBe(
      "Only letters, numbers, spaces, hyphens, and periods allowed",
    );
    expect(validateName("🎮")).toBe("Only letters, numbers, spaces, hyphens, and periods allowed");
  });

  it("returns error when exceeding max length", () => {
    const long = "A".repeat(MAX_NAME_LENGTH + 1);
    expect(validateName(long)).toBe(`Name must be ${MAX_NAME_LENGTH} characters or less`);
  });

  it("returns null for empty string", () => {
    expect(validateName("")).toBeNull();
  });

  it("returns null at exactly max length", () => {
    const exact = "A".repeat(MAX_NAME_LENGTH);
    expect(validateName(exact)).toBeNull();
  });
});
