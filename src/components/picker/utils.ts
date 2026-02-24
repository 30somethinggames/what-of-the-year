import type { PickerItem } from "./types";

/**
 * Extracts a stable string key for each picker item. Defined outside the
 * component to avoid creating a new function reference on every render.
 */
export function keyExtractor(item: PickerItem) {
  return String(item.value);
}

export function getInitialScrollIndex<T extends PickerItem>(data: T[], value: T): number {
  return Math.max(
    0,
    data.findIndex((d) => d.value === value.value),
  );
}
