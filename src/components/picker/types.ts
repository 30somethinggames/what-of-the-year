export interface PickerItem {
  value: string | number;
  label: string;
}

export interface PickerProps<T extends PickerItem> {
  data: T[];
  value: T;
  onValueChange: (v: T) => void;
  testID?: string;
}
