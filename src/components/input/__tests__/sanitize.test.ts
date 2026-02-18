import { describe, expect, it } from "bun:test";

import { MAX_NAME_LENGTH, sanitizeName, validateName } from "../sanitize";

describe("sanitizeName", () => {
  it("allows alphanumeric characters and spaces", () => {
    expect(sanitizeName("Ryan 123")).toBe("Ryan 123");
  });

  it("allows apostrophes, hyphens, and periods", () => {
    expect(sanitizeName("O'Brien-Jr.")).toBe("O'Brien-Jr.");
  });

  it("strips HTML tags", () => {
    expect(sanitizeName("<script>alert('xss')</script>")).toBe("scriptalert'xss'scri");
  });

  it("strips control characters", () => {
    expect(sanitizeName("Ryan\u0000\u001F\u200B")).toBe("Ryan");
  });

  it("strips zero-width and format characters", () => {
    expect(sanitizeName("R\u200By\uFEFFa\u2028n")).toBe("Ryan");
  });

  it("collapses consecutive spaces", () => {
    expect(sanitizeName("Ryan   Seery")).toBe("Ryan Seery");
  });

  it("trims leading whitespace", () => {
    expect(sanitizeName("  Ryan")).toBe("Ryan");
  });

  it("enforces max length", () => {
    const long = "A".repeat(30);
    expect(sanitizeName(long)).toHaveLength(MAX_NAME_LENGTH);
  });

  it("strips emoji and special unicode", () => {
    expect(sanitizeName("Ryan 🎮")).toBe("Ryan ");
  });

  it("handles empty string", () => {
    expect(sanitizeName("")).toBe("");
  });

  it("handles string of only disallowed characters", () => {
    expect(sanitizeName("!!!@@@###$$$")).toBe("");
  });

  it("preserves valid name after stripping", () => {
    expect(sanitizeName("  <b>John</b>  ")).toBe("bJohnb ");
  });
});

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
