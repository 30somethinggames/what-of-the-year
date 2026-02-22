import { describe, expect, it } from "bun:test";

import { currentYear } from "../dates";

describe("currentYear", () => {
  it("should return year and Unix timestamps for boundaries", () => {
    const result = currentYear("2024");

    expect(result.year).toBe(2024);
    expect(result.startDate).toBe(new Date(2024, 0, 1).getTime() / 1000);
    expect(result.endDate).toBe(new Date(2025, 0, 1).getTime() / 1000);
  });

  it("should handle leap year correctly", () => {
    const result = currentYear("2024");
    const nonLeap = currentYear("2023");

    // Leap year has one extra day
    expect(result.endDate - result.startDate).toBeGreaterThan(nonLeap.endDate - nonLeap.startDate);
  });
});
