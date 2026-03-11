import { describe, expect, it } from "bun:test";

import type { Option } from "types/option";

import { filterOptions } from "../filter-options";

const option = (id: number, name: string): Option => ({
  id,
  name,
  cover: undefined,
  rating: 80,
  first_release_date: 0,
  summary: undefined,
});

const options: Option[] = [
  option(1, "Star Wars"),
  option(2, "Stardew Valley"),
  option(3, "Super Mario"),
  option(4, "Skyrim"),
  option(5, "The Last of Us"),
  option(6, "Starfield"),
  option(7, "Street Fighter"),
  option(8, "Spider-Man"),
  option(9, "Sonic Adventure"),
  option(10, "Splatoon"),
  option(11, "Subnautica"),
];

describe("filterOptions", () => {
  it("returns empty array when query is empty", () => {
    expect(filterOptions(options, "")).toEqual([]);
    expect(filterOptions(options, " ")).toEqual([]);
  });

  it("matches with a single character", () => {
    const result = filterOptions(options, "t");
    const names = result.map((o) => o.name);

    expect(names).toEqual(["The Last of Us"]);
  });

  it("matches options that start with the query (case-insensitive)", () => {
    const result = filterOptions(options, "st");
    const names = result.map((o) => o.name);

    expect(names).toEqual(["Star Wars", "Stardew Valley", "Starfield", "Street Fighter"]);
  });

  it("matches words in the middle of the name", () => {
    const result = filterOptions(options, "la");
    const names = result.map((o) => o.name);

    expect(names).toEqual(["The Last of Us"]);
  });

  it("matches 'mario' to 'Super Mario' via word boundary", () => {
    const result = filterOptions(options, "mario");
    const names = result.map((o) => o.name);

    expect(names).toEqual(["Super Mario"]);
  });

  it("ranks prefix matches before word-boundary matches", () => {
    const result = filterOptions(
      [option(1, "Adventure Time"), option(2, "Sonic Adventure")],
      "adventure",
    );
    const names = result.map((o) => o.name);

    expect(names).toEqual(["Adventure Time", "Sonic Adventure"]);
  });

  it("trims and lowercases the query", () => {
    const result = filterOptions(options, "  SU  ");
    const names = result.map((o) => o.name);

    expect(names).toEqual(["Super Mario", "Subnautica"]);
  });

  it("returns all matches without a cap", () => {
    const result = filterOptions(options, "s");

    expect(result).toHaveLength(10);
  });

  it("returns empty array when options list is empty", () => {
    expect(filterOptions([], "star")).toEqual([]);
  });

  it("returns empty array when nothing matches", () => {
    expect(filterOptions(options, "zz")).toEqual([]);
  });
});
