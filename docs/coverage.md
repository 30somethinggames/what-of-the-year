# What asserts each rule

Every numbered rule in [the game](game.md), against the assertion that fails
if the rule is broken. A rule nothing asserts — or a part of one — is what a
rewrite can lose without a test going red, and its row carries a proposal for
the spec that would catch it.

## How to read it

One row per rule, in the order `game.md` gives them.

| column | what it holds |
| --- | --- |
| rule | the rule's number, as `game.md` numbers it |
| asserted by | the assertion's file and line — for a `(unit)` row, the `it()` that holds it |
| what fails | what that assertion says, short enough to recognise |
| gap | the part of the rule nothing asserts, and the proposal that would close it where there is one |

`none` in **asserted by** means nothing in the repo fails when the rule is
broken. Line numbers are the ones this page was written against.

The gap column says when a rule is server-tested but never seen through a
browser.

## Home

| rule | asserted by | what fails | gap |
| --- | --- | --- | --- |
| H1 | `playwright/pregame/smoke.e2e.ts:8` | topic picker, year picker and **Start** all visible | — |
| H2 | `playwright/pregame/home.e2e.ts:30` | scrolling the topic picker to index 2 lands on `/books/…` | Movie at index 1 is never asserted; `smoke.e2e.ts:17` pins Game as the default |
| H3 | `playwright/pregame/home.e2e.ts:30` | year index 1 is the previous year, so the years descend | the 1987 floor has no assertion |
| H4 | `playwright/pregame/home.e2e.ts:14` | a `scrollend` at a row's offset makes that row the value | — |
| H5 | `playwright/pregame/home.e2e.ts:30` | **Start** navigates to `/<topic>/<year>` | "nothing is created and nobody is signed in yet" has no assertion |

## Identity

| rule | asserted by | what fails | gap |
| --- | --- | --- | --- |
| I1 | `playwright/game/seed.e2e.ts:26` | `expect(hostUid).toBe(uid)`, the uid the page minted on load | the spinner before it settles has no assertion |
| I2 | `playwright/pregame/identity.e2e.ts:22` | a reload and a second tab both skip the join form, count stays `2 of 10` | — |
| I3 | `playwright/pregame/smoke.e2e.ts:14` | avatar, **Random**, name field and the button all visible | nothing asserts the button reads **Join** rather than **Create** |
| I4 | none | — | **Proposal**: clicking **Random** changes the avatar's `src`, in `pregame/identity.e2e.ts` |
| I5 | `playwright/pregame/name-validation.e2e.ts:44` | 26 typed characters leave `abcdefghijklmnopqrst` in the field | — |
| I6 | `playwright/pregame/name-validation.e2e.ts:27` | `Bob!` shows "Only letters, numbers, spaces, hyphens, and periods allowed" | the apostrophe the server allows is untested either way |
| I7 | `playwright/pregame/name-validation.e2e.ts:22` | the button is disabled for an empty and for an invalid name | "while the year's options are still loading" has no assertion |
| I8 | `playwright/pregame/name-validation.e2e.ts:78` | `Twin` appears twice and the count reads `3 of 10` | — |
| I9 | `playwright/pregame/smoke.e2e.ts:24` | **Create** lands on a lobby showing **Invite** and **Start** | — |
| I10 | none | — | **Proposal**: `/widgets/2026` renders `error.state`, in `pregame/error.e2e.ts` |

## Lobby

| rule | asserted by | what fails | gap |
| --- | --- | --- | --- |
| L1 | `playwright/game/seed.e2e.ts:32` | the count reads `1 of 10` | the heading's `Lobby ` prefix has no assertion |
| L2 | `playwright/game/multiplayer.e2e.ts:19` | `Host` renders against the host's row | the row's avatar, and the lobby's own ✕, have no assertion |
| L3 | `convex/__tests__/players.test.ts:215` (unit) | `joinSession` throws `SESSION_FULL` at `maxPlayers` | — |
| L4 | `playwright/game/non-host.e2e.ts:31` | a guest sees **Leave** and neither **Invite** nor **Start** | — |
| L5 | `convex/__tests__/players.test.ts:326` (unit) | `leaveSession` throws `HOST_CANNOT_LEAVE` and keeps the host's row | nothing asserts the host's lobby renders no **Leave** |
| L6 | `playwright/pregame/lobby.e2e.ts:22` | the clipboard holds `/games/<year>/<sessionId>` | the confirming toast has no assertion |
| L7 | `playwright/pregame/name-validation.e2e.ts:18` | a newcomer on the session URL gets the name field | the lobby heading above it, and the **Join** label, have no assertion |
| L8 | `playwright/pregame/session-full.e2e.ts:30` | the toast reads "Session is full" and the newcomer is never listed | — |
| L9 | `playwright/pregame/identity.e2e.ts:28` | a member reopening the link gets **Leave**, not the join form | — |
| L10 | `playwright/pregame/identity.e2e.ts:50` | the host's count drops to `1 of 10`, and the rejoiner shows under a new name | — |
| L11 | `convex/__tests__/players.test.ts:527` (unit) | `kickFromLobby` throws `CANNOT_KICK_HOST` | no spec clicks the ✕ in the lobby, and none asserts the host's row has none |
| L12 | none | — | **Proposal**: a guest removed from the lobby is back on the join form and can join again, in `pregame/lobby.e2e.ts` |
| L13 | `playwright/game/non-host.e2e.ts:36` | the host starts and the guest's page reaches Round 10 without navigating | — |

## Rounds

| rule | asserted by | what fails | gap |
| --- | --- | --- | --- |
| R1 | `playwright/game/single-player.e2e.ts:48` | rounds 9 down to 1 each render before results | — |
| R2 | `playwright/game/three-browsers.e2e.ts:143` | round 3 pays `8pts`, round 2 `9pts`, round 1 `10pts` | `single-player.e2e.ts:56` does not — see [the verified rows](#three-rows-verified) |
| R3 | `playwright/pregame/smoke.e2e.ts:30` | `Round 10` and ☰ both render | the `<Topic> of <year> - ` part of the header has no assertion |
| R4 | `playwright/game/single-player.e2e.ts:43` | the pick list, the field and **Enter** all render | — |
| R5 | none | — | **Proposal**: the own-picks rows read `#10`, `#9` … in that order, in `game/single-player.e2e.ts` |
| R6 | `src/components/autocomplete/__tests__/filter-options.test.ts:64` (unit) | prefix matches rank before word-boundary ones; an empty query returns nothing | no spec asserts a suggestion carries its rating |
| R7 | `convex/__tests__/options.test.ts:149` (unit) | a second read of a year serves the cache and calls no API | the 500 / 100 / 40 caps have no assertion |
| R8 | `src/screens/round/__tests__/use-available-options.test.ts:22` (unit) | an already-used title is filtered out of the options | browser only, by design — see `game.md`'s discrepancies |
| R9 | none | — | **Proposal**: **Enter** stays disabled while the field holds typed text no suggestion was clicked for, in `game/single-player.e2e.ts` |
| R10 | `playwright/game/multiplayer.e2e.ts:50` | **Enter** is disabled once the pick is in | — |
| R11 | `playwright/game/single-player.e2e.ts:44` | a closed round carries no **Edit**; `multiplayer.e2e.ts:53` drives the open one's | **Cancel** is asserted visible but never clicked |
| R12 | `convex/__tests__/selections.test.ts:219` (unit) | `getSelections` withholds every pick while the round is open | `multiplayer.e2e.ts:166` covers the ✓; no spec asserts the pick text is absent |
| R13 | `playwright/game/three-browsers.e2e.ts:117` | two of three picks leave every page out of the reveal; the third starts it | — |
| R14 | `playwright/game/multiplayer.e2e.ts:96` | advancing a round with picks reveals; `non-host.e2e.ts:195` advances an empty one straight | — |
| R15 | `convex/__tests__/players.test.ts:350` (unit) | a leaver's picks go from every round, and `:365` closes the round they were last in | no spec plays it through a browser, and nothing asserts that close runs no reveal |

## Reveal

| rule | asserted by | what fails | gap |
| --- | --- | --- | --- |
| V1 | `playwright/game/reveal.e2e.ts:77` | both pages show the reveal container | — |
| V2 | `playwright/game/reveal.e2e.ts:25` | the reveal names the player | one pick at a time, and the row of dots, have no assertion — **Proposal**: one pick on screen at a time and a dot per pick filling, in `game/reveal.e2e.ts` |
| V3 | none | — | **Proposal**: the second pick replaces the first about 3 seconds in, and the last one stays, in `game/reveal.e2e.ts` |
| V4 | none | — | **Proposal**: a round where one of two players never picked reveals one card, naming only the picker, in `game/reveal.e2e.ts` |
| V5 | `playwright/game/reveal-timeout.e2e.ts:44` | with nobody skipping, the round still opens Round 9 | the `4n + 5` window is bounded only by the 30s test timeout |
| V6 | `playwright/game/reveal.e2e.ts:78` | the host sees **Skip Reveal**, the guest does not; `reveal-timeout.e2e.ts:39` grows the fill | the guest-side assertion does not fail cleanly — see [the verified rows](#three-rows-verified) |
| V7 | `playwright/game/three-browsers.e2e.ts:126` | guests hold no **Skip Reveal** through three reveals | "nothing a guest does shortens it" has no assertion |
| V8 | `playwright/game/reveal.e2e.ts:45` | skipping round 1's reveal renders the results list | — |

## Results

| rule | asserted by | what fails | gap |
| --- | --- | --- | --- |
| S1 | `playwright/game/three-browsers.e2e.ts:134` | all three pages render results with nobody navigating | the sidebar at results is X9, which nothing asserts |
| S2 | `playwright/game/results.e2e.ts:47` | row 0 is the highest scorer; `three-browsers.e2e.ts:137` counts one row per distinct title | the literal `#1` has no assertion |
| S3 | `playwright/game/results.e2e.ts:47` | the row carries the title, both pickers' names and `4pts` | the cover has no assertion |
| S4 | `playwright/game/results.e2e.ts:40` | a title picked three times over two rounds totals `4pts` | — |
| S5 | `convex/__tests__/selections.test.ts:287` (unit) | `getResults` tallies only the rounds that have revealed | nothing asserts a host-skipped empty round adds no row, and R15's unseen close is never seen through a browser |

## Sidebar and settings

| rule | asserted by | what fails | gap |
| --- | --- | --- | --- |
| X1 | `playwright/game/sidebar.e2e.ts:22` | ☰ opens it, ✕ and the backdrop each close it | "the lobby has no ☰" has no assertion |
| X2 | `playwright/game/sidebar.e2e.ts:24` | the title reads **Players**; `multiplayer.e2e.ts:155` pins ✓ and `...` | the `N of 10` count inside the sidebar has no assertion |
| X3 | `playwright/game/non-host.e2e.ts:46` | a guest gets no **Next Round**; `multiplayer.e2e.ts:112` pins **End Game** on round 1 | the order of the two buttons has no assertion |
| X4 | `playwright/game/multiplayer.e2e.ts:96` | **Next Round** closes the round in play, and the reveal appears | — |
| X5 | `playwright/game/non-host.e2e.ts:109` | the guest lands home and drops off the host's roster | — |
| X6 | `playwright/game/non-host.e2e.ts:152` | every guest gets "The host forfeited the game." and goes home | — |
| X7 | `playwright/game/sidebar.e2e.ts:69` | the kicked player leaves the host's list mid-game | — |
| X8 | `playwright/game/sidebar.e2e.ts:113` | the kicked player gets "Player not in session" and a way home | "the session's link no longer admits them" has no assertion |
| X9 | none | — | **Proposal**: at results, **End Game** toasts "Session is not in play" and the host's **Leave Game** still forfeits, in `game/results.e2e.ts` |

## Errors

| rule | asserted by | what fails | gap |
| --- | --- | --- | --- |
| E1 | `playwright/pregame/error.e2e.ts:11` | the error state renders with **Retry**; `join-closed.e2e.ts:26` walks **Home** to `/` | nothing asserts **Retry** reloads |
| E2 | `playwright/game/sidebar.e2e.ts:113` | a thrown query shows the server's own message | — |
| E3 | `playwright/pregame/join-closed.e2e.ts:26` | the root error state offers **Home**, and it goes to `/` | no one assertion pins both buttons, and a failed sign-in has none at all |
| E4 | `playwright/pregame/option-failure.e2e.ts:18` | a failing fetch replaces the join screen, and `:42` the round screen | "after two silent retries" has no assertion |
| E5 | `playwright/pregame/rate-limit.e2e.ts:25` | a refused action shows the server's message in a toast | the 3-second dismissal and the cap of three have no assertion |
| E6 | `playwright/pregame/join-closed.e2e.ts:19` | a newcomer on a live game gets the error state, not the join form | — |
| E7 | `playwright/pregame/join-closed.e2e.ts:54` | a newcomer on an ended session goes home with the forfeit toast | — |
| E8 | none | — | **Proposal**: unreachable today — `error.e2e.ts:26` records why the checksum blocks it; the ticket is to reach it, by deleting one session through a test route, in `pregame/error.e2e.ts` |

## Rate limits

| rule | asserted by | what fails | gap |
| --- | --- | --- | --- |
| T1 | `playwright/pregame/rate-limit.e2e.ts:25` | a sixth create in a minute toasts "Slow down and try again" and writes nothing | only the create bucket goes through a browser; `players.test.ts:278` and `options.test.ts:111` cover two more |
| T2 | none | — | **Proposal**: starting, ending, leaving and kicking stay under no bucket, in `convex/__tests__/ratelimits.test.ts` (new file) |
| T3 | `convex/__tests__/options.test.ts:149` (unit) | a repeat year is served from the cache with no API call | "the allowance is spent before the cache is read" has no assertion |
| T4 | none | — | **Proposal**: a reload refetches the year's options and spends the allowance again, in `pregame/option-failure.e2e.ts` |

## Three rows verified

Each rule below was broken in the code, the spec run, and the break reverted.
The run was Playwright against this checkout's local Convex backend, chromium
only. `git status` was empty afterwards.

### R2 — a round is worth `11 - <round>`

Broken by `convex/selections.ts:102`, `points: MAX_ROUNDS + 1 - roundNumber`
→ `points: roundNumber`. `playwright/game/three-browsers.e2e.ts` fails:

```
  143 |       expect(order.some((row) => row.includes(pick.name) && row.includes(pick.points))).toBe(true);

    Error: expect(received).toBe(expected) // Object.is equality
    Expected: true
    Received: false
      at playwright/game/three-browsers.e2e.ts:143:89
```

`playwright/game/single-player.e2e.ts` **passed** under the same break. Its
only scoring assertion is `expect(page.getByText("10pts").first())`, and with
the weights inverted round 10 pays 10 instead of 1, so the string is still on
the screen. `three-browsers.e2e.ts:143` is the assertion that holds R2.

### L8 — joining a full session fails with "Session is full"

Broken by `convex/players.ts:33`, `>=` → `>`, so the eleventh player is let
in. `playwright/pregame/session-full.e2e.ts` fails:

```
   30 |   await expect(guestPage.getByTestId(testIds.toast.root)).toContainText("Session is full");

    Expected substring: "Session is full"
    Timeout: 15000ms
    Error: element(s) not found
      at playwright/pregame/session-full.e2e.ts:30:59
```

### V6 — only the host sees **Skip Reveal**

Broken by `src/screens/round/reveal.tsx:89`, `{isHost ? (` →
`{isHost || !isHost ? (`, so every player gets the button. Both specs fail,
but neither at the assertion that names the rule:

```
   65 |   await hostPage.getByTestId(testIds.reveal.skip).click();

    Test timeout of 30000ms exceeded.
    Error: locator.click: Test ended.
    Call log:
      - waiting for getByTestId('reveal-skip')
      at playwright/game/non-host.e2e.ts:65:51
```

`playwright/game/reveal.e2e.ts` fails identically, at its own line 83.

The guest-side assertion is `not.toBeVisible()`, which polls. A two-player
reveal lasts 13 seconds and the assertion waits 15, so the reveal ends, the
button leaves the guest's screen, and the assertion passes on a technicality.
The run only fails afterwards, when the host's button has gone too. The rule
is covered, but the failure does not name it, and a reveal longer than the
expect timeout would hide it altogether. Worth a ticket of its own:
`toHaveCount(0)` against the reveal container, asserted while the reveal is
known to be running.

## Proposals, in the order to cut them

Twelve: the eleven rules nothing asserts, and V2, which is asserted only in
part. Most player-visible loss first, and each is one ticket under #263.

1. **V4** — only submitted picks are revealed, in the server's order, and a player who never picked is not named. `game/reveal.e2e.ts`.
2. **V3** — a pick holds the screen about 3 seconds, and the last one stays until the reveal ends. `game/reveal.e2e.ts`.
3. **R9** — **Enter** stays disabled for typed text no suggestion was chosen for. `game/single-player.e2e.ts`.
4. **R5** — own picks read `#10`, `#9` … ascending by round. `game/single-player.e2e.ts`.
5. **X9** — at results, **End Game** toasts "Session is not in play" and **Leave Game** still forfeits. `game/results.e2e.ts`.
6. **V2** — one pick on screen at a time, with a dot per pick filling as it goes. `game/reveal.e2e.ts`.
7. **L12** — a guest removed from the lobby is back on the join form and may join again. `pregame/lobby.e2e.ts`.
8. **I10** — a topic the app does not have renders the error state. `pregame/error.e2e.ts`.
9. **E8** — a well-formed session ID naming no session renders "Something went wrong" with neither button; needs a way to delete one session first. `pregame/error.e2e.ts`.
10. **I4** — **Random** draws a different avatar. `pregame/identity.e2e.ts`.
11. **T4** — a reload refetches the year's options and spends the allowance again. `pregame/option-failure.e2e.ts`.
12. **T2** — starting, ending, leaving and kicking are under no bucket. `convex/__tests__/ratelimits.test.ts`, a new file.
