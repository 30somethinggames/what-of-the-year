import { describe, expect, it } from "bun:test";

import { MAX_NAME_LENGTH, validateAvatar, validateName } from "convex/utils/validate";

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

describe("validateAvatar", () => {
  it("returns null for valid DiceBear URLs", () => {
    expect(validateAvatar("https://api.dicebear.com/7.x/bottts/svg?seed=abc123")).toBeNull();
    expect(validateAvatar("https://api.dicebear.com/7.x/bottts/svg?seed=x9k2m")).toBeNull();
  });

  it("returns error for wrong prefix", () => {
    expect(validateAvatar("https://evil.com/avatar.svg")).toBe("Invalid avatar URL");
    expect(validateAvatar("javascript:alert(1)")).toBe("Invalid avatar URL");
    expect(validateAvatar("")).toBe("Invalid avatar URL");
  });

  it("returns error for invalid seed", () => {
    expect(validateAvatar("https://api.dicebear.com/7.x/bottts/svg?seed=")).toBe(
      "Invalid avatar seed",
    );
    expect(validateAvatar("https://api.dicebear.com/7.x/bottts/svg?seed=<script>")).toBe(
      "Invalid avatar seed",
    );
    expect(validateAvatar("https://api.dicebear.com/7.x/bottts/svg?seed=a b c")).toBe(
      "Invalid avatar seed",
    );
  });
});
