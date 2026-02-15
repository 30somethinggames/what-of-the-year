import { describe, expect, it } from "bun:test";

import { years } from "../years";

const currentYear = new Date().getFullYear();

describe("years", () => {
  it("starts with the current year", () => {
    expect(years[0].value).toBe(currentYear);
    expect(years[0].label).toBe(String(currentYear));
  });

  it("ends with 1987", () => {
    const last = years[years.length - 1];
    expect(last.value).toBe(1987);
    expect(last.label).toBe("1987");
  });

  it("has the correct length", () => {
    expect(years).toHaveLength(currentYear - 1987 + 1);
  });

  it("is sorted descending", () => {
    for (let i = 1; i < years.length; i++) {
      expect(years[i - 1].value).toBeGreaterThan(years[i].value);
    }
  });

  it("has matching value and label for each entry", () => {
    for (const year of years) {
      expect(year.label).toBe(String(year.value));
    }
  });
});
