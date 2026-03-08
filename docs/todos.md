1. host ends game — auto-navigate all players to home with a message ("The host ended the game")
   - currently players see `<Error />` when session is deleted, no redirect
   - needs: session `state` field or deletion detection, global listener, toast/alert on redirect
1. handle host duties
   - player should be able to do it solo
   - host can kick people
1. E2E Multiplayer Testing Strategy
   - screen testing by screenshot - available in maestro
   - Figure out [doc](./testing-strat.md)
   - Define host-specific features (kick, advance round, etc.) then figure out how to e2e test host vs guest perspectives without adding conditional/test-only code to the backend
1. EAS
   - Embed fonts via `expo-font` config plugin in app.json instead of runtime `useFonts`
1. Figure out [deeplinks](./universal-links.md)
   - detour?

## V2

1. bad-words
1. host handoff — transfer host to another player instead of ending the game
1. [drag and drop](drag-and-drop.md)
1. db
   - general look through / clean up
