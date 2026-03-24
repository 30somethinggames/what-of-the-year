## Vite Migration — Remaining

1. **Single-player round auto-advance bug** — After picking in round 9, the round doesn't advance to 8. `saveSelection` may be failing silently inside the empty `catch {}`. Need to debug whether the mutation throws or the Convex subscription isn't updating `activeRound`.
2. **Multiplayer test: pts strict mode** — `getByText(/\d+pts/)` matches multiple elements, needs `.first()`.
3. **Smoke test flakiness** — Auth state from previous test runs pollutes later tests. May need `beforeEach` cleanup or isolated browser contexts.
4. **Remove debug logging** — `console.log`/`console.error` in `src/screens/round/round.tsx` and `page.on("console")` in `playwright/single-player.e2e.ts` added during debugging.
5. **Format pass** — Run `bun run format` after all fixes.

## Backlog

1. E2E Multiplayer Testing Strategy
   - **Non-host**
     - leave game
     - see "host ended the game" alert (hard with single device + API players)

## V2

1. bad-words
1. host handoff — transfer host to another player instead of ending the game
