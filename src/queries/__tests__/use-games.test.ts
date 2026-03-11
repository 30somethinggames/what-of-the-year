import { describe, expect, it } from "bun:test";

import { formGameOptions } from "../transforms";

const mockGame = {
  id: 1,
  name: "Test Game",
  cover: { id: 101, url: "//test.jpg" },
  rating: 85.5,
  aggregated_rating: 90.0,
  total_rating: 87.75,
  category: 0,
  first_release_date: 1704067200,
  summary: "Test summary",
};

const mockGameWithoutCover = {
  id: 2,
  name: "Test Game 2",
  rating: 70.0,
  aggregated_rating: 75.0,
  total_rating: 72.5,
  category: 0,
  first_release_date: 1709251200,
  summary: "Game without cover",
};

describe("formGameOptions", () => {
  it("should transform games to Option format", () => {
    const result = formGameOptions([mockGame])[0];

    expect(result.id).toBe(1);
    expect(result.name).toBe("Test Game");
    expect(result.cover).toBe("//test.jpg");
    expect(result.rating).toBe(87.75); // Uses total_rating
    expect(result.first_release_date).toBe(1704067200);
    expect(result.summary).toBe("Test summary");
  });

  it("should handle missing cover", () => {
    const result = formGameOptions([mockGameWithoutCover])[0];

    expect(result.cover).toBeUndefined();
  });
});
