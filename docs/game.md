# The game

What of the Year, as a player sees it: every screen, every rule, every limit.
Written from the code and the e2e specs as they stand. Where the two disagree,
the disagreement is a bullet under [Discrepancies](#discrepancies), not a fix.

Every rule is numbered so another page can cite it. What asserts each one, and
what asserts none of them, is [coverage.md](coverage.md). A prefix is a phase:

| prefix | phase |
| --- | --- |
| `H` | [Home](#home) |
| `I` | [Identity](#identity) |
| `L` | [Lobby](#lobby) |
| `R` | [Rounds](#rounds) |
| `V` | [Reveal](#reveal) |
| `S` | [Results](#results) |
| `X` | [Sidebar and settings](#sidebar-and-settings) |
| `E` | [Errors](#errors) |
| `T` | [Rate limits](#rate-limits) |

## Shape of a game

A group picks the best thing of a year. One player creates a session and
becomes its **host**; everyone else joins by link and is a **guest**. The game
is ten rounds. Each round every player names one title, the picks are revealed
together, and the next round opens. Round 10 is worth one point and round 1 is
worth ten, so the last pick is the one that decides it. Results rank every
title by the points it collected.

The server's session status decides which screen renders. No client navigates
between phases: a player who reloads, or who opens the link late, lands on
whatever the session is doing now.

## Home

`/`

- **H1** — The home screen is two pickers, topic and year, and a **Start**
  button.
- **H2** — The topics are Game, Movie and Book, in that order. Game is
  preselected.
- **H3** — The years run from the current year down to 1987. The current year
  is preselected.
- **H4** — A picker is a vertical scroller, one entry at a time. The entry it
  comes to rest on becomes the value.
- **H5** — **Start** goes to `/<topic>/<year>`. Nothing is created and nobody
  is signed in yet.

## Identity

`/<topic>/<year>` — and the same screen behind a session link the visitor has
not joined.

- **I1** — Opening any URL below `/<topic>` signs the visitor in anonymously.
  The screen is a spinner until that settles.
- **I2** — The identity a visitor gets is stored in their browser. A reload,
  or a second tab of the same browser, is the same player; a different browser
  is a different player. There is no account and no password.
- **I3** — The screen is an avatar, a **Random** button, a name field, and one
  button: **Create** when the URL names no session, **Join** when it does.
- **I4** — The avatar is drawn from a random seed. **Random** draws a new one.
  A player cannot choose or upload an avatar.
- **I5** — A name is at most 20 characters. The field stops accepting input at
  that length, so an over-long name never reaches the server.
- **I6** — A name may contain letters, digits, spaces, apostrophes, hyphens and
  periods. Anything else shows an error under the field.
- **I7** — The button is disabled while the name is empty or invalid, and while
  the year's options are still loading.
- **I8** — Names are neither trimmed nor unique. A name of spaces is accepted,
  and two players in one session may share a name.
- **I9** — **Create** opens a session and lands its creator in the lobby as
  host. **Join** adds the player to the lobby named in the URL.
- **I10** — A topic the app does not have is the [error state](#errors), not a
  blank screen.

## Lobby

`/<topic>/<year>/<sessionId>`, while the session has not started.

- **L1** — The heading is `Lobby <Topic> of <year>`. Below it is the roster,
  and below that a count, `N of 10`.
- **L2** — A roster row is the player's avatar and name, and `Host` against the
  host. The host alone also sees a ✕ on every guest's row; a guest sees no ✕.
- **L3** — A session holds at most 10 players, the host included.
- **L4** — The host sees **Invite** and **Start**. A guest sees **Leave**.
- **L5** — The host has no way to leave the lobby. The server refuses a host's
  leave outright.
- **L6** — **Invite** copies `<origin>/<topic>/<year>/<sessionId>` to the
  clipboard and confirms with a toast. The session ID is the invitation: anyone
  holding the link can join, and nothing else is checked.
- **L7** — Opening that link as a newcomer shows the [identity](#identity)
  screen under the lobby's heading, with the button reading **Join**.
- **L8** — Joining a session already at 10 players fails with the toast
  "Session is full". The newcomer stays on the join form and is never listed.
- **L9** — A player already in the session who reopens the link goes straight
  to the lobby, with no join form.
- **L10** — **Leave** removes the guest and sends them home. Everyone else's
  roster updates at once. That guest may rejoin the same lobby, under a new
  name if they like.
- **L11** — The host removes a guest with the ✕ on their row. The host's own
  row has none, and the server refuses any attempt to remove a host.
- **L12** — Removal from the lobby is silent for the removed player: they are
  back on the join form, free to join again while the session is in the lobby.
- **L13** — **Start** is the host's alone. It opens round 10, and every client
  moves to it without navigating.

## Rounds

The screen behind the same session URL once the game has started.

- **R1** — A game is ten rounds, played from round 10 down to round 1.
- **R2** — A round is worth `11 - <round>` points: round 10 pays 1 point,
  round 1 pays 10.
- **R3** — The header is `<Topic> of <year> - Round <n>`, with ☰ beside it.
- **R4** — The screen is the player's own picks so far, then a text field and
  **Enter**.
- **R5** — Own picks are listed by round number ascending. A row is `#<round>`,
  the cover and the title.
- **R6** — Typing at least one character lists matching titles: those starting
  with what was typed first, then those with a word starting with it. Each
  suggestion carries its rating. An empty field lists nothing.
- **R7** — The options for a year are fetched once and reused: up to 500 rated
  games released that year, up to 100 movies by popularity, and the 40
  highest-rated books first published that year.
- **R8** — A title the player has used in an earlier round of this session is
  not offered again.
- **R9** — **Enter** is enabled only once a suggestion has been chosen from the
  list. Typing a title and stopping there submits nothing.
- **R10** — One pick per player per round. After submitting, **Enter** is
  disabled for the rest of the round.
- **R11** — While the round is open, the pick made in it carries **Edit**: the
  title returns to the field, the button becomes **Save**, and **Cancel**
  abandons the change. Rounds already closed carry no **Edit**.
- **R12** — A pick is secret until the round closes. Until then the others see
  only that the player has picked — a ✓ against their name in the
  [sidebar](#sidebar-and-settings) — and the pick itself never leaves the
  server.
- **R13** — The round closes the moment the picks in it reach the number of
  players. That starts the [reveal](#reveal) for everyone, unless the number
  was reached by a player leaving — see [R15](#rounds).
- **R14** — The host can close a round early, from the sidebar. With at least
  one pick in, the reveal runs; with none, the next round opens immediately and
  nothing is revealed.
- **R15** — A player who leaves or is removed mid-round takes their picks with
  them, from every round. If the players left have all picked, the round closes
  there and then — and this is the one close that runs no [reveal](#reveal):
  the next round opens at once and that round's picks are never shown.

## Reveal

- **V1** — The reveal replaces the round screen for every player at once.
- **V2** — It shows one pick at a time: the player's avatar and name above the
  title and its cover. A row of dots, one per pick, fills as it goes.
- **V3** — A pick is on screen for 3 seconds before the next one. The last pick
  stays until the reveal ends.
- **V4** — Only picks actually submitted are shown. Their order is the
  server's, by player identity, not the order the picks were saved in. A
  player who never picked is not mentioned.
- **V5** — A reveal runs for `4 seconds per player plus 5`: 9 seconds for a
  single player, 45 for ten. When it ends the server closes the round and opens
  the next one.
- **V6** — Only the host sees **Skip Reveal**. Its fill is the countdown to the
  end of the reveal, and pressing it closes the round immediately.
- **V7** — Nothing is required of a guest during a reveal, and nothing a guest
  does shortens it.
- **V8** — Closing round 1, by timeout or by skip, ends the game and shows
  [results](#results).

## Results

- **S1** — Results render for every player as soon as the game ends. Nobody
  navigates to them, and the sidebar stays available.
- **S2** — The list is one row per distinct title, ranked by total points, the
  highest first as `#1`.
- **S3** — A row is the cover, the title, the names of everyone who picked it,
  and its total in points.
- **S4** — A title picked by more than one player collects every one of those
  picks' points. A title picked in an early round beats the same title picked
  late.
- **S5** — Only closed rounds are counted, the round closed by [R15](#rounds)
  among them even though nobody saw it. A round the host skipped with nobody's
  pick in it is worth nothing to anyone.

## Sidebar and settings

- **X1** — ☰ in the game header opens the sidebar. ✕ or a tap on the backdrop
  closes it. The lobby has no ☰.
- **X2** — The sidebar is titled **Players** and lists the roster, with ✓ or
  `...` against each player for the round in play, and the same `N of 10`
  count.
- **X3** — The host sees **Next Round** above **Leave Game** — **End Game** on
  round 1. A guest sees **Leave Game** alone.
- **X9** — The sidebar is the same at [results](#results): the host still sees
  **End Game**, which does nothing there but toast "Session is not in play".
  **Leave Game** still works, and the host's still forfeits — a finished game's
  results are taken off every guest's screen by it.
- **X4** — **Next Round** is [R14](#rounds): it closes the round in play, or
  skips the reveal that round is already running.
- **X5** — A guest's **Leave Game** removes them from the session and sends
  them home. Everyone else's roster updates.
- **X6** — The host's **Leave Game** ends the session for everybody. The host
  goes home; every guest is sent home with the toast "The host forfeited the
  game."
- **X7** — The host can remove a guest from the sidebar at any point in the
  game, with the ✕ on their row. A guest's sidebar has no ✕.
- **X8** — A player removed mid-game lands on the [error state](#errors),
  "Player not in session", with a way home. The session's link no longer admits
  them: the game has started.

## Errors

- **E1** — The error state is a sad robot, a message, and up to two buttons:
  **Retry**, which reloads the page, and **Home**, which returns to `/`.
- **E2** — Anything a live query throws lands there: a malformed session ID, a
  read by somebody who is not a member, a topic the app does not have. The message is the server's, or "Something went wrong" for anything
  that did not come from the app's own error.
- **E3** — The root error state offers both buttons. A failed sign-in offers
  **Retry** alone, since there is nothing to go home to.
- **E4** — A failed option fetch replaces the whole screen — the join screen or
  the round screen — after two silent retries.
- **E5** — A failed action is a toast, not the error state: the server's own
  message, dismissed after 3 seconds, at most three on screen at once.
- **E6** — A newcomer opening the link of a game already in play gets the error
  state, not an invitation to join.
- **E7** — A newcomer opening the link of a session the host ended is sent home
  with the forfeit toast.
- **E8** — A well-formed session ID that names no session reads as nothing
  rather than throwing, so the screen is "Something went wrong" with neither
  button. Editing the URL is the only way out.
- **E9** — The server serves options only for a year from 1987 to the current
  year, the range the picker offers in [H3](#home). Any other year in the URL —
  out of range, or not a number — is refused before a source is called, so it
  loads no options and reaches the [E4](#errors) screen.
- **E10** — A refused year and a source that is down are both failures of the
  app's plumbing rather than its own errors, so [E2](#errors) gives "Something
  went wrong" with no reason. An option fetch over its allowance is the app's
  own error, and that screen reads "Slow down and try again" instead.

## Rate limits

Each is a per-player allowance per minute. A refused mutation spends nothing,
since its token rolls back with everything else the call wrote. An option fetch
is an action, which has no transaction to roll back, and its year is checked
after the token is spent, so a refused year costs the allowance anyway.

| action | allowance |
| --- | --- |
| create a session | 5 a minute |
| join a session | 10 a minute |
| submit a pick | 20 a minute |
| edit a pick | 20 a minute |
| advance or skip a round | 30 a minute |
| load a year's options, per topic | 10 a minute |

- **T1** — Over the limit, the call is refused with the toast "Slow down and
  try again" and nothing is written.
- **T2** — Starting a game, ending it, leaving it and removing a player are not
  rate limited.
- **T3** — A year's options are cached on the server for 24 hours, so the
  source behind them is called once a day at most. The allowance is spent
  before that cache is read, so a cached answer costs the same as a fetched
  one.
- **T4** — The browser's copy of the options lives in memory for 24 hours,
  which is as long as the tab. A reload or a second tab loads them again, and
  spends the allowance again.
- **T5** — Every allowance above is a bucket that refills, not a window that
  turns over. It starts full, and gains a token at its own rate: a 20-a-minute
  bucket gains one every 3 seconds and never holds more than 20.
- **T6** — So a player may spend a whole allowance at once, and waits only for
  the next token rather than for a minute to end. Nothing resets on the minute,
  and no two players share a bucket.

## Discrepancies

Each is code that disagrees with the specs, a message or itself. Fixing any of
them is its own ticket; none is fixed here.

- A second, fuller settings screen lives at
  `/<topic>/<year>/<sessionId>/settings` (`src/screens/settings.tsx`) and
  nothing links to it — ☰ opens the sidebar instead. Its **Leave Game** never
  calls `leaveSession` for a guest, so a guest who reaches it by URL goes home
  while staying in the session.
- The `N of 10` count of [L1](#lobby) is drawn in white on the white
  background (`text-white-100` in `components/lists/players.tsx`), so a player
  cannot read it. The specs assert its text, which a screen reader and
  Playwright both get.
- The name error message names "letters, numbers, spaces, hyphens, and
  periods", but `convex/utils/validate.ts` also allows apostrophes.
- [I8](#identity) is the behaviour, not the intent:
  `playwright/pregame/name-validation.e2e.ts` pins whitespace-only and
  duplicate names as accepted and says the ticket expected them blocked.
- [E4](#errors) is likewise pinned rather than intended:
  `playwright/pregame/option-failure.e2e.ts` says the round screen was expected
  to stay usable through an option outage, and `throwOnError` in
  `src/queries/use-*.ts` replaces it instead.
- `convex/constants.ts` says a forfeited session renders results for the other
  players. `src/hooks/use-game-over.ts` sends every guest home first, so a
  forfeited game's results are seen by nobody.
- [R8](#rounds) is enforced only in the browser: `saveSelection` accepts a
  title the same player already used in an earlier round.
- [X9](#sidebar-and-settings) is a dead button: the sidebar renders at results
  with `activeRoundNumber` still 1 (`src/db/use-sessions.ts`), so the host is
  offered **End Game** for a game already over, and `advanceRound` refuses it
  with "Session is not in play".
- `joinSession` has a "Session is closed" message for a session past its lobby,
  but no player can see it: [E6](#errors) puts a newcomer on the error state
  before any join is attempted.
