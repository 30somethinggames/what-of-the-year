# Reveal Phase

After each round closes, show all players' picks one at a time before advancing to the next round. This is the core social moment — where players react to each other's choices.

## Current Flow

```
all players pick (or host advances)
  → round state: "open" → "closed"
  → next round state: "pending" → "open"
  → session.activeRoundNumber decrements
  → clients see new activeRoundNumber and re-render
```

## Proposed Flow

```
all players pick (or host advances)
  → round state: "open" → "revealing"
  → clients enter reveal phase (step through each player's pick)
  → after reveal completes (auto-timer or host taps "Next Round")
  → round state: "revealing" → "closed"
  → next round state: "pending" → "open"
  → session.activeRoundNumber decrements
```

## Backend Changes

### Schema

Add `"revealing"` to round state union:

```ts
// convex/schema.ts
state: v.union(v.literal("pending"), v.literal("open"), v.literal("closed"), v.literal("revealing")),
```

### Mutations

**`saveSelection`** — when all players have picked, transition to `"revealing"` instead of `"closed"`:

```
if (allComplete) {
  patch round → state: "revealing", closedAt: Date.now()
  // do NOT open next round yet
}
```

**`advanceRound`** — needs to handle two cases:

1. Round is `"open"` (host skips remaining picks) → transition to `"revealing"`
2. Round is `"revealing"` (host skips reveal) → transition to `"closed"`, open next round

**New internal mutation: `completeReveal`** — transitions round from `"revealing"` → `"closed"` and opens the next round. Called in two ways:

1. **Auto-advance via `ctx.scheduler`** — when a round enters `"revealing"`, schedule `completeReveal` to run after a delay (e.g. 30 seconds). This is the default path — the reveal has a fixed duration, and the server auto-advances when it's done.
2. **Host skip** — host calls `advanceRound` while state is `"revealing"`, which cancels the scheduled job and calls `completeReveal` immediately.

Use `internalMutation` so it can't be called directly from clients.

### Scheduling

When transitioning a round to `"revealing"` (in both `saveSelection` and `advanceRound`):

```ts
import { internal } from "./_generated/api";

const REVEAL_DURATION_MS = 30_000; // 30 seconds — tune based on player count

const jobId = await ctx.scheduler.runAfter(
  REVEAL_DURATION_MS,
  internal.rounds.completeReveal,
  { sessionId, roundNumber }
);
```

Store the scheduled job ID on the round doc so it can be cancelled:

```ts
// Add to rounds schema:
revealJobId: v.optional(v.id("_scheduled_functions")),
```

When host skips the reveal:

```ts
if (round.revealJobId) {
  await ctx.scheduler.cancel(round.revealJobId);
}
// then call completeReveal logic inline
```

Scheduled mutations execute exactly once with automatic retry, so the auto-advance is reliable even if the host disconnects.

### Reveal Duration

The reveal duration should scale with player count so each pick gets enough screen time. A simple formula:

```ts
const REVEAL_DURATION_MS = playerCount * 4_000 + 5_000;
// 3 players → 17s, 5 players → 25s, 10 players → 45s
```

Store the reveal end time on the round doc so clients can show a countdown:

```ts
// Add to rounds schema:
revealEndsAt: v.optional(v.number()),
```

### Queries

**`getSelections`** — already returns all selections for a round. Currently gated behind auth but not round state. During `"revealing"`, all players should see all selections (not just their own). This may already work as-is — verify that non-owners can see others' picks when the round is in `"revealing"` state.

## Frontend Changes

### Round State Hook (`use-round-state.ts`)

Detect when the current round enters `"revealing"` state:

- When `round.state === "revealing"`, switch the round screen to reveal mode
- Fetch all selections for the round via `useSelections`
- Fetch all players via `usePlayers` to map uid → name/avatar

### Reveal Screen Component

New component: `src/screens/round/reveal.tsx`

- Receives: selections array, players array
- Steps through each selection one at a time on a timer (e.g. 3 seconds each)
- Shows: player avatar + name, pick name + cover art, animated entrance
- Shows a countdown timer synced to `round.revealEndsAt` so players know when it auto-advances
- Host can skip early via "Skip" button (cancels scheduled job, advances immediately)
- Use Framer Motion for entrance animations (slide in, scale up, etc.)

### Round Screen Integration

```tsx
// round.tsx — simplified
if (round.state === "revealing") {
  return <Reveal sessionId={sessionId} roundNumber={round.number} />;
}
// ... existing pick UI
```

### Navigation

- `useRoundState` currently navigates to results when round 1 closes. This still works — the reveal for round 1 happens while state is `"revealing"`, then when it transitions to `"closed"`, the existing navigation fires.
- `activeRoundNumber` doesn't change until reveal completes, so URL stays stable during the reveal.

## Sidebar / Settings

- During reveal, the sidebar "Advance Round" button label changes to "Skip Reveal"
- Calls `advanceRound` which handles the `"revealing"` → `"closed"` transition

## Edge Cases

- **Player joins during reveal:** They see the reveal in progress (the selections query will return all picks). They'll enter the reveal at whatever step the timer is at — fine, since each client runs its own timer and the host controls advancement.
- **Last round (round 1):** Reveal plays, then `completeReveal` closes the round, which triggers the existing navigation to results.
- **Host disconnects during reveal:** No problem — `ctx.scheduler` handles auto-advance server-side. The scheduled `completeReveal` fires regardless of client state.
- **Single player:** Reveal still plays but could be faster or skippable. Host is the only player so they can tap "Next Round" immediately.

## Test IDs

- `reveal-container` — reveal phase wrapper
- `reveal-pick` — individual pick card during reveal
- `reveal-player-name` — player name on reveal card
- `reveal-skip` — host's "Skip" button
- `reveal-countdown` — countdown timer

## Sequencing

1. Schema change (add `"revealing"` state)
2. Backend mutations (`saveSelection`, `advanceRound`, `completeReveal`)
3. `useSelections` / `usePlayers` — verify they work for reveal
4. Reveal component with Framer Motion animations
5. Wire into round screen and sidebar
6. Playwright tests for reveal flow
