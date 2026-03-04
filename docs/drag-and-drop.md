# Drag & Drop Reordering

## Overview

Allow users to reorder their picks via drag & drop instead of only editing the text. This lets a user move their #3 pick to #1 without re-entering everything.

## Recommended Package

**`react-native-draggable-flatlist`** (v4+)

- Built on `react-native-reanimated` + `react-native-gesture-handler` (both already installed)
- Drop-in replacement for `FlatList`
- Well maintained, widely used

## Implementation Plan

### 1. Install & Wire Up the List

- `bun add react-native-draggable-flatlist`
- Replace `FlatList` in `round.tsx` with `DraggableFlatList`
- Add a drag handle (e.g. `≡` icon) to each row using `ScaleDecorator` + `renderItem`'s `drag` callback
- `GestureHandlerRootView` may need to wrap the screen (check if Expo's layout already provides it)

### 2. Create `swapSelections` convex Util

When a user drags pick A from round X to round Y's position, we need to swap the `pick` data on both selection docs atomically.

```ts
// db/utils/swap-selections.ts
interface SwapSelectionsArgs {
  sessionId: string;
  uid: string;
  fromRound: number;
  toRound: number;
}

export async function swapSelections({ sessionId, uid, fromRound, toRound }: SwapSelectionsArgs) {
  // Use a transaction to:
  // 1. Read both selection docs
  // 2. Swap their `pick` fields
  // 3. Update `savedAt` on both
  // Points stay the same (tied to round number, not pick)
}
```

### 3. Handle `onDragEnd`

```ts
const onDragEnd = ({ data }: { data: MySelection[] }) => {
  // Compare old order vs new order
  // Find which two rounds were swapped
  // Call swapSelections()
};
```

### 4. Convex Rules

Current rules allow `update` on selections by the owner — no changes needed.

### 5. Edge Cases

- **Only swap completed rounds** — can't reorder a pick that doesn't exist yet
- **Active round pick** — allow reordering only after it's submitted
- **Optimistic UI** — `DraggableFlatList` handles visual reorder immediately; if Convex write fails, the real-time listener will revert
- **Multi-item shift** — dragging from position 5 to position 2 means a shift, not a simple swap. Would need to update picks for rounds 2, 3, 4, and 5. Consider batching all affected writes in a single Convex batch.

## Complexity Notes

- The shift (vs swap) logic is the hardest part — moving one item shifts all items between the old and new positions
- Each shift updates N selection docs where N = distance moved
- Batch writes handle up to 500 ops so this is fine for 10 rounds
- Consider whether the UX should be swap-only (simpler) or full reorder (more natural but more writes)
