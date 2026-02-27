import { describe, expect, it } from "bun:test";

import type { Timestamp } from "firebase/firestore";

import type { MySelection } from "db/hooks/use-my-selections";
import type { Option } from "types/option";

import { computeAvailableOptions } from "../utils/use-available-options";

// Minimal fake Timestamp to satisfy the TypeScript shape in tests.
const fakeTimestamp: Timestamp = {
  seconds: 0,
  nanoseconds: 0,
  toDate: () => new Date(0),
  toMillis: () => 0,
} as unknown as Timestamp;

describe("computeAvailableOptions", () => {
  const options: Option[] = [
    { id: 1, name: "One", cover: undefined, rating: 0, first_release_date: 0, summary: undefined },
    { id: 2, name: "Two", cover: undefined, rating: 0, first_release_date: 0, summary: undefined },
    {
      id: 3,
      name: "Three",
      cover: undefined,
      rating: 0,
      first_release_date: 0,
      summary: undefined,
    },
  ];

  it("filters out picks already selected by the user", () => {
    const mySelections: MySelection[] = [
      { roundNumber: 1, pick: { id: "2", name: "Two" }, points: 1, savedAt: fakeTimestamp },
    ];

    const avail = computeAvailableOptions(options, mySelections, null);
    expect(avail.map((o) => o.id)).toEqual([1, 3]);
  });

  it("keeps the pick for the round being edited", () => {
    const mySelections: MySelection[] = [
      { roundNumber: 2, pick: { id: "2", name: "Two" }, points: 1, savedAt: fakeTimestamp },
    ];

    const avail = computeAvailableOptions(options, mySelections, 2);
    expect(avail.map((o) => o.id)).toEqual([1, 2, 3]);
  });
});
