import { afterEach, describe, expect, it, mock } from "bun:test";

import { MAX_ROUNDS } from "constants/session";

// --- Mock Firestore and config BEFORE importing createSession ---
const mockSessionBatchSet = mock(() => {});
const mockSessionBatchCommit = mock(() => Promise.resolve());
const mockRoundsBatchSet = mock(() => {});
const mockRoundsBatchCommit = mock(() => Promise.resolve());

let batchCallCount = 0;

mock.module("db/config", () => ({
  db: {},
}));

mock.module("firebase/firestore", () => ({
  Timestamp: {
    fromMillis: (ms: number) => ({ _type: "timestamp", ms }),
  },
  doc: (_collection: unknown) => ({ id: "mock-session-id" }),
  collection: (...segments: string[]) => ({ path: segments.join("/") }),
  writeBatch: () => {
    batchCallCount++;
    if (batchCallCount % 2 === 1) {
      return { set: mockSessionBatchSet, commit: mockSessionBatchCommit };
    }
    return { set: mockRoundsBatchSet, commit: mockRoundsBatchCommit };
  },
  serverTimestamp: () => ({ _type: "serverTimestamp" }),
  runTransaction: () => Promise.resolve(),
  increment: (n: number) => ({ _type: "increment", value: n }),
}));

// Import AFTER mocks are registered
const { createSession } = await import("../utils/create-session");

describe("createSession", () => {
  afterEach(() => {
    mockSessionBatchSet.mockClear();
    mockSessionBatchCommit.mockClear();
    mockRoundsBatchSet.mockClear();
    mockRoundsBatchCommit.mockClear();
  });

  it("returns a sessionId", async () => {
    const result = await createSession({
      topic: "games",
      year: 2025,
      uid: "user-123",
      name: "Ryan",
      avatar: "seed-abc",
    });

    expect(result.sessionId).toBe("mock-session-id");
  });

  it("creates 1 session + 1 player in batch 1 and 10 rounds in batch 2", async () => {
    await createSession({
      topic: "movies",
      year: 2024,
      uid: "user-456",
      name: "Guest",
      avatar: "seed-xyz",
    });

    // Batch 1: 1 session + 1 player
    expect(mockSessionBatchSet).toHaveBeenCalledTimes(2);
    // Batch 2: 10 rounds
    expect(mockRoundsBatchSet).toHaveBeenCalledTimes(MAX_ROUNDS);
  });

  it("commits each batch exactly once", async () => {
    await createSession({
      topic: "books",
      year: 2023,
      uid: "user-789",
      name: "Test",
      avatar: "seed-123",
    });

    expect(mockSessionBatchCommit).toHaveBeenCalledTimes(1);
    expect(mockRoundsBatchCommit).toHaveBeenCalledTimes(1);
  });

  it("sets session doc with correct topic and year", async () => {
    await createSession({
      topic: "games",
      year: 2025,
      uid: "user-123",
      name: "Ryan",
      avatar: "seed-abc",
    });

    const sessionCall = (mockSessionBatchSet.mock.calls as unknown[][])[0];
    const sessionData = sessionCall?.[1] as unknown as Record<string, unknown>;

    expect(sessionData.topic).toBe("games");
    expect(sessionData.year).toBe(2025);
    expect(sessionData.isOpen).toBe(true);
    expect(sessionData.playerCount).toBe(1);
    expect(sessionData.activeRoundNumber).toBe(1);
    expect(sessionData.createdAt).toEqual({ _type: "serverTimestamp" });
    expect(sessionData.expiresAt).toHaveProperty("ms");
  });

  it("sets player doc with host flag", async () => {
    await createSession({
      topic: "games",
      year: 2025,
      uid: "user-123",
      name: "Ryan",
      avatar: "seed-abc",
    });

    const playerCall = (mockSessionBatchSet.mock.calls as unknown[][])[1];
    const playerData = playerCall?.[1] as unknown as Record<string, unknown>;

    expect(playerData.name).toBe("Ryan");
    expect(playerData.avatar).toBe("seed-abc");
    expect(playerData.isHost).toBe(true);
    expect(playerData.joinedAt).toEqual({ _type: "serverTimestamp" });
  });

  it("creates rounds numbered 1 through 10 with correct weights", async () => {
    await createSession({
      topic: "games",
      year: 2025,
      uid: "user-123",
      name: "Ryan",
      avatar: "seed-abc",
    });

    // Rounds are in the second batch
    for (let i = 0; i < MAX_ROUNDS; i++) {
      const roundCall = (mockRoundsBatchSet.mock.calls as unknown[][])[i];
      const roundData = roundCall?.[1] as unknown as Record<string, unknown>;

      expect(roundData.number).toBe(i + 1);
      expect(roundData.weight).toBe(i + 1);
      expect(roundData.state).toBe("pending");
      expect(roundData.selectionsComplete).toBe(0);
    }
  });
});
