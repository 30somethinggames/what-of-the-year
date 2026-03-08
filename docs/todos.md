1. E2E Multiplayer Testing Strategy
   - kick player from lobby (host kicks API-added player, assert they disappear)
   - kick player from game (same during gameplay, verify selections cleaned up)
   - host ends game early via `endSession` (settings → Leave Game mid-game)
   - non-host leaves game
   - guest perspective (seeing "host ended the game" alert — hard with single device + API players)
1. EAS
   - Embed fonts via `expo-font` config plugin in app.json instead of runtime `useFonts`
1. Figure out [deeplinks](./universal-links.md)
   - detour?

## V2

1. custom toast component — replace `Alert.alert` with a cross-platform styled toast (Alert.alert falls back to `window.alert` on web)
1. bad-words
1. host handoff — transfer host to another player instead of ending the game
1. [drag and drop](drag-and-drop.md)
1. db
   - general look through / clean up
