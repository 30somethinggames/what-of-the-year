import { afterEach, describe, expect, it, mock } from "bun:test";

// --- Mock everything BEFORE importing leaveSession ---
const mockTransactionGet = mock<
  () => Promise<{ exists: () => boolean; data: () => Record<string, unknown> }>
>(() =>
  Promise.resolve({
    exists: () => false as boolean,
    data: () => ({}) as Record<string, unknown>,
  }),
);
const mockTransactionDelete = mock<(...args: unknown[]) => void>(() => {});
const mockTransactionUpdate = mock<(...args: unknown[]) => void>(() => {});

mock.module("db/config", () => ({
  db: {},
}));

mock.module("db/collections", () => ({
  sessionRef: (id: string) => ({ path: `sessions/${id}`, id }),
  playerRef: (sessionId: string, uid: string) => ({
    path: `sessions/${sessionId}/players/${uid}`,
    id: uid,
  }),
}));

mock.module("firebase/firestore", () => ({
  runTransaction: (_db: unknown, fn: (transaction: unknown) => Promise<void>) => {
    return fn({
      get: mockTransactionGet,
      delete: mockTransactionDelete,
      update: mockTransactionUpdate,
    });
  },
  increment: (n: number) => ({ _type: "increment", value: n }),
}));

const { leaveSession } = await import("../utils/leave-session");

describe("leaveSession", () => {
  afterEach(() => {
    mockTransactionGet.mockClear();
    mockTransactionDelete.mockClear();
    mockTransactionUpdate.mockClear();
  });

  it("deletes the player and decrements playerCount", async () => {
    mockTransactionGet
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({}),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ isHost: false }),
      });

    await leaveSession({ sessionId: "session-abc", uid: "user-456" });

    expect(mockTransactionDelete).toHaveBeenCalledTimes(1);
    expect(mockTransactionUpdate).toHaveBeenCalledTimes(1);

    const updateData = mockTransactionUpdate.mock.calls[0]![1] as Record<string, unknown>;
    expect(updateData.playerCount).toEqual({ _type: "increment", value: -1 });
  });

  it("throws if session does not exist", async () => {
    mockTransactionGet.mockResolvedValueOnce({
      exists: () => false,
      data: () => ({}),
    });

    expect(leaveSession({ sessionId: "nonexistent", uid: "user-456" })).rejects.toThrow(
      "Session not found",
    );
  });

  it("throws if player is not in session", async () => {
    mockTransactionGet
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({}),
      })
      .mockResolvedValueOnce({
        exists: () => false,
        data: () => ({}),
      });

    expect(leaveSession({ sessionId: "session-abc", uid: "user-456" })).rejects.toThrow(
      "Player not in session",
    );
  });

  it("throws if player is the host", async () => {
    mockTransactionGet
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({}),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ isHost: true }),
      });

    expect(leaveSession({ sessionId: "session-abc", uid: "user-456" })).rejects.toThrow(
      "Host cannot leave session",
    );
  });
});
