/** Height in pixels for each picker row. Used for snap intervals and layout calculations. */
export const ITEM_HEIGHT = 88;

/** A selectable item within the picker. */
export interface PickerItem {
  /** Unique value identifying the item. */
  value: string | number;
  /** Display text shown in the picker row. */
  label: string;
}

export interface PickerProps<T extends PickerItem> {
  /** The list of selectable items. */
  data: T[];
  /** The currently selected item. */
  value: T;
  /** Called when the user scrolls to and settles on a new item. */
  onValueChange: (v: T) => void;
  /** Optional test ID forwarded to the underlying list. */
  testID?: string;
}
