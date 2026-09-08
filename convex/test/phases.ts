/**
 * One definition of what a phase looks like, shared by the `convex-test`
 * harness (`convex/__tests__/harness.setup.ts`) and the `/test/seed-game`
 * route, so a unit test and an e2e spec never disagree about what `round:7` or
 * `ended` means.
 *
 * Test-only: plain `Error` throws are fine here (never reachable on prod).
 */
import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { MAX_PLAYERS, MAX_ROUNDS, SessionStatus, Topic } from "../constants";
import { revealDurationMs } from "../utils/rounds";

/** A uid for a player no browser will ever sign in as. */
export function testUid() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** The id a pick carries when the seed invents one from a name. */
export function pickId(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

/**
 * `lobby`, `ended`, or a round number: `round:7` is round 7 open and waiting on
 * picks, `revealing:7` is round 7 closed and showing them. Rounds count down,
 * so a game starts at `round:10` and finishes at `round:1`.
 */
export type Phase = "lobby" | "ended" | `round:${number}` | `revealing:${number}`;

type ParsedPhase =
  | { kind: "lobby" }
  | { kind: "ended" }
  | { kind: "round" | "revealing"; number: number };

export function parsePhase(phase: string): ParsedPhase {
  if (phase === "lobby") return { kind: "lobby" };
  if (phase === "ended") return { kind: "ended" };

  const match = /^(round|revealing):(\d+)$/.exec(phase);
  if (!match) throw new Error(`Unknown phase: ${phase}`);

  const number = Number(match[2]);
  if (number < 1 || number > MAX_ROUNDS) throw new Error(`Round ${number} is out of range`);

  return { kind: match[1] as "round" | "revealing", number };
}

function roundState(phase: ParsedPhase, number: number): Doc<"rounds">["state"] {
  if (phase.kind === "lobby") return "pending";
  if (phase.kind === "ended") return "closed";
  if (number > phase.number) return "closed";
  if (number < phase.number) return "pending";
  return phase.kind === "round" ? "open" : "revealing";
}

export type SeedPlayer = { name: string; avatar?: string; uid?: string };
export type SeedSelection = { uid: string; roundNumber: number; pickName: string };

export type SeededPlayer = { uid: string; name: string; isHost: boolean };
export type SeededGame = {
  sessionId: Id<"sessions">;
  roundIds: Id<"rounds">[];
  players: SeededPlayer[];
};

export type SeedGameArgs = {
  topic?: string;
  year?: number;
  phase?: string;
  players: SeedPlayer[];
  selections?: SeedSelection[];
};

/** Handed out in order when a player brings no avatar of its own. */
const AVATARS = ["🐙", "🦊", "🐝", "🦉", "🐢", "🦄", "🐳", "🦁", "🐸", "🦋"];

type SeedCtx = Pick<MutationCtx, "db" | "scheduler">;

/**
 * A whole session at `phase`: the session row, its players (the first is the
 * host), `MAX_ROUNDS` rounds in the states that phase implies, and any
 * selections asked for. A `revealing` phase also schedules the reveal job
 * `advanceRound` would have queued, so the round times out on its own.
 */
export async function seedSession(
  ctx: SeedCtx,
  { topic = Topic.GAMES, year = 2026, phase = "lobby", players, selections = [] }: SeedGameArgs,
): Promise<SeededGame> {
  const parsed = parsePhase(phase);

  if (players.length === 0) throw new Error("A session needs at least one player");
  if (players.length > MAX_PLAYERS) {
    throw new Error(`A session holds at most ${MAX_PLAYERS} players`);
  }

  const status =
    parsed.kind === "lobby"
      ? SessionStatus.LOBBY
      : parsed.kind === "ended"
        ? SessionStatus.COMPLETE
        : SessionStatus.ACTIVE;

  // Rounds count down, so the lobby and a finished game both sit on round 1 —
  // where `createSession` starts and where `completeRevealLogic` leaves it.
  const activeRoundNumber =
    parsed.kind === "round" || parsed.kind === "revealing" ? parsed.number : 1;

  const sessionId = await ctx.db.insert("sessions", {
    topic,
    year,
    maxRounds: MAX_ROUNDS,
    maxPlayers: MAX_PLAYERS,
    playerCount: players.length,
    activeRoundNumber,
    status,
  });

  const seededPlayers: SeededPlayer[] = [];

  for (const [index, player] of players.entries()) {
    const seeded = { uid: player.uid ?? testUid(), name: player.name, isHost: index === 0 };

    await ctx.db.insert("players", {
      sessionId,
      uid: seeded.uid,
      name: seeded.name,
      avatar: player.avatar ?? AVATARS[index % AVATARS.length]!,
      isHost: seeded.isHost,
    });

    seededPlayers.push(seeded);
  }

  const now = Date.now();

  // One entry per round number, so a caller can bump `selectionsComplete` once
  // per round rather than re-reading the row for every selection.
  const completeByRound = new Map<number, number>();
  for (const selection of selections) {
    completeByRound.set(
      selection.roundNumber,
      (completeByRound.get(selection.roundNumber) ?? 0) + 1,
    );
  }

  const roundIds: Id<"rounds">[] = [];

  for (let number = 1; number <= MAX_ROUNDS; number++) {
    const state = roundState(parsed, number);

    roundIds.push(
      await ctx.db.insert("rounds", {
        sessionId,
        number,
        state,
        weight: MAX_ROUNDS + 1 - number,
        selectionsComplete: completeByRound.get(number) ?? 0,
        startedAt: state === "pending" ? null : now,
        closedAt: state === "closed" || state === "revealing" ? now : null,
      }),
    );
  }

  for (const { uid, roundNumber, pickName } of selections) {
    const roundId = roundIds[roundNumber - 1];
    if (!roundId) throw new Error(`Round ${roundNumber} is out of range`);

    await ctx.db.insert("selections", {
      sessionId,
      roundId,
      uid,
      pick: { id: pickId(pickName), name: pickName },
      points: MAX_ROUNDS + 1 - roundNumber,
      roundNumber,
      savedAt: now,
    });
  }

  if (parsed.kind === "revealing") {
    const roundId = roundIds[parsed.number - 1]!;
    const durationMs = revealDurationMs(players.length);

    const revealJobId = await ctx.scheduler.runAfter(durationMs, internal.rounds.completeReveal, {
      sessionId,
      roundNumber: parsed.number,
    });

    await ctx.db.patch(roundId, { revealJobId, revealEndsAt: Date.now() + durationMs });
  }

  return { sessionId, roundIds, players: seededPlayers };
}
