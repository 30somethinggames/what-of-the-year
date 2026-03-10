# Performance Issues & Gotchas

| # | Severity | File | Line | Issue |
|---|----------|------|------|-------|
| 1 | Medium | `components/lists/players.tsx` | 25-40 | Inline `renderItem` on FlatList — new function ref every render |
| 2 | Low | `components/autocomplete/autocomplete.tsx` | 109-122 | Inline `renderItem` on FlatList — new function ref every render |
| 3 | Low | `components/autocomplete/autocomplete.tsx` | 113 | Inline `onPress={() => handleSelect(item)}` inside FlatList `renderItem` — new function ref per row per render |
| 4 | Low | `screens/topic/topic.tsx` | 39 | `useEffect` missing `signIn` in dependency array — relies on `signIn` being referentially stable |
| 5 | Low | `queries/use-topic-data.ts` | 6-10 | All three topic hooks (`useGames`, `useMovies`, `useBooks`) instantiated regardless of topic — `useAction` called 3x when only 1 is needed (queries are gated by `enabled` so no wasted network requests) |
