import { describe, expect, it } from "bun:test";

import { buildAllRounds, buildPlayer, buildRound, buildSession, getRoundWeight } from "../builders";
import { MAX_PLAYERS, MAX_ROUNDS } from "constants/session";

describe("getRoundWeight", () => {
  it("returns the round number as the weight", () => {
    expect(getRoundWeight(1)).toBe(1);
    expect(getRoundWeight(5)).toBe(5);
    expect(getRoundWeight(10)).toBe(10);
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
      weight: 3,
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

  it("assigns incrementing weights", () => {
    const rounds = buildAllRounds();
    const weights = rounds.map((r) => r.weight);
    expect(weights).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
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
