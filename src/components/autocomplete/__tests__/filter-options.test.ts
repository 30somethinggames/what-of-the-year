import { describe, expect, it } from "bun:test";

import { filterOptions } from "../filter-options";
import type { Option } from "types/option";

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

  it("does not match substrings in the middle of the name", () => {
    const result = filterOptions(options, "la");

    expect(result).toEqual([]);
  });

  it("trims and lowercases the query", () => {
    const result = filterOptions(options, "  SU  ");
    const names = result.map((o) => o.name);

    expect(names).toEqual(["Super Mario", "Subnautica"]);
  });

  it("caps results at 8", () => {
    const result = filterOptions(options, "s");

    expect(result).toHaveLength(8);
  });

  it("returns at most 8 results when many options match", () => {
    const manyOptions = Array.from({ length: 20 }, (_, i) => option(i, `Star ${i}`));
    const result = filterOptions(manyOptions, "st");

    expect(result).toHaveLength(8);
  });

  it("returns empty array when options list is empty", () => {
    expect(filterOptions([], "star")).toEqual([]);
  });

  it("returns empty array when nothing matches", () => {
    expect(filterOptions(options, "zz")).toEqual([]);
  });
});
