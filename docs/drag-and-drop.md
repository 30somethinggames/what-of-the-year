# Drag & Drop Reordering

## Overview

Allow users to reorder their picks via drag & drop. Moving a pick to a new position reassigns `points` for all affected selections based on their new position — `roundNumber` is unchanged (historical record only).

## Package

**`react-native-draggable-flatlist`** — built on Reanimated + Gesture Handler (both already installed).

```bash
bun add react-native-draggable-flatlist
```

## Implementation Plan

### 1. Convex mutation: `reorderSelections`

Takes the new ordered array of selection IDs and patches `points` based on position:

```ts
// convex/selections.ts
export const reorderSelections = mutation({
  args: {
    sessionId: v.id("sessions"),
    orderedIds: v.array(v.id("selections")),
  },
  handler: async (ctx, { sessionId, orderedIds }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    for (let i = 0; i < orderedIds.length; i++) {
      await ctx.db.patch(orderedIds[i], {
        points: MAX_ROUNDS - i,
      });
    }
  },
});
```

Position 0 = most points (`MAX_ROUNDS`), position N = least. Simple, no swapping needed.

### 2. Update `round.tsx`

- Replace `FlatList` with `DraggableFlatList`
- Add drag handle to each row via `ScaleDecorator` + `drag` callback
- Add `useMutation(api.selections.reorderSelections)`
- Implement `onDragEnd`:

```ts
const reorderSelections = useMutation(api.selections.reorderSelections);

const onDragEnd = ({ data }: { data: typeof mySelections }) => {
  reorderSelections({
    sessionId,
    orderedIds: data.map((s) => s._id),
  });
};
```

Convex real-time will reflect the updated points immediately. If the write fails, the listener reverts.

### 3. GestureHandlerRootView

Check if Expo Router's root layout already wraps with `GestureHandlerRootView`. If not, add it to `_layout.tsx`.

## Edge Cases

- **Only reorder submitted picks** — disable drag on the current active round's row until submitted
- **Optimistic UI** — `DraggableFlatList` handles the visual reorder immediately, Convex reverts on failure
- **Results** — `getResults` query already uses `points` not `roundNumber` so scoring is automatically correct after reorder

## Complexity

Low-medium. The mutation is simple — no swapping, no shift logic, just reassign points by position. The library handles all the gesture complexity.
