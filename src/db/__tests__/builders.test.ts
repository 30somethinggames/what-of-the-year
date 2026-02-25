import { describe, expect, it } from "bun:test";

import { MAX_PLAYERS, MAX_ROUNDS } from "constants/session";

import {
  buildAllRounds,
  buildPick,
  buildPlayer,
  buildRound,
  buildSession,
  getRoundWeight,
} from "../builders";

describe("getRoundWeight", () => {
  it("returns inverted weight (round 10 = 1pt, round 1 = 10pt)", () => {
    expect(getRoundWeight(1)).toBe(10);
    expect(getRoundWeight(5)).toBe(6);
    expect(getRoundWeight(10)).toBe(1);
  });
});

describe("buildSession", () => {
  it("creates a session with correct defaults", () => {
    const session = buildSession("games", 2025);

    expect(session).toEqual({
      topic: "games",
      year: 2025,
      maxRounds: MAX_ROUNDS,
      maxPlayers: MAX_PLAYERS,
      isOpen: true,
      playerCount: 1,
      activeRoundNumber: 1,
    });
  });

  it("sets playerCount to 1 (host)", () => {
    const session = buildSession("movies", 2024);
    expect(session.playerCount).toBe(1);
  });

  it("starts on round 1", () => {
    const session = buildSession("books", 2023);
    expect(session.activeRoundNumber).toBe(1);
  });

  it("defaults to open", () => {
    const session = buildSession("games", 2025);
    expect(session.isOpen).toBe(true);
  });
});

describe("buildPlayer", () => {
  it("creates a host player", () => {
    const player = buildPlayer("Ryan", "avatar-seed", true);

    expect(player).toEqual({
      name: "Ryan",
      avatar: "avatar-seed",
      isHost: true,
    });
  });

  it("creates a non-host player", () => {
    const player = buildPlayer("Guest", "other-seed", false);

    expect(player).toEqual({
      name: "Guest",
      avatar: "other-seed",
      isHost: false,
    });
  });
});

describe("buildRound", () => {
  it("creates a pending round with correct weight", () => {
    const round = buildRound(3);

    expect(round).toEqual({
      number: 3,
      state: "pending",
      weight: 8,
      selectionsComplete: 0,
      startedAt: null,
      closedAt: null,
    });
  });

  it("starts with zero selections", () => {
    const round = buildRound(1);
    expect(round.selectionsComplete).toBe(0);
  });

  it("has no timestamps initially", () => {
    const round = buildRound(5);
    expect(round.startedAt).toBeNull();
    expect(round.closedAt).toBeNull();
  });
});

describe("buildAllRounds", () => {
  it("creates 10 rounds by default", () => {
    const rounds = buildAllRounds();
    expect(rounds).toHaveLength(MAX_ROUNDS);
  });

  it("numbers rounds 1 through maxRounds", () => {
    const rounds = buildAllRounds();
    const numbers = rounds.map((r) => r.number);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("assigns inverted weights (round 1 = 10pt, round 10 = 1pt)", () => {
    const rounds = buildAllRounds();
    const weights = rounds.map((r) => r.weight);
    expect(weights).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  });

  it("all rounds start as pending", () => {
    const rounds = buildAllRounds();
    expect(rounds.every((r) => r.state === "pending")).toBe(true);
  });

  it("supports custom round count", () => {
    const rounds = buildAllRounds(5);
    expect(rounds).toHaveLength(5);
    expect(rounds[4].number).toBe(5);
  });

  it("total possible points equals sum of 1..maxRounds", () => {
    const rounds = buildAllRounds();
    const totalPoints = rounds.reduce((sum, r) => sum + r.weight, 0);
    // sum of 1..10 = 55
    expect(totalPoints).toBe(55);
  });
});

describe("buildPick", () => {
  it("creates a pick with name and kebab-case id", () => {
    const pick = buildPick("The Last of Us");

    expect(pick).toEqual({
      id: "the-last-of-us",
      name: "The Last of Us",
    });
  });

  it("lowercases the id", () => {
    const pick = buildPick("Elden Ring");
    expect(pick.id).toBe("elden-ring");
  });

  it("preserves original casing in name", () => {
    const pick = buildPick("Elden Ring");
    expect(pick.name).toBe("Elden Ring");
  });

  it("collapses multiple spaces into a single hyphen", () => {
    const pick = buildPick("Red   Dead   Redemption");
    expect(pick.id).toBe("red-dead-redemption");
  });

  it("handles single word", () => {
    const pick = buildPick("Concord");
    expect(pick).toEqual({ id: "concord", name: "Concord" });
  });
});
