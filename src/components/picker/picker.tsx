import { useEffect, useRef } from "react";

export interface PickerItem {
  value: string | number;
  label: string;
}

interface Props<T extends PickerItem> {
  data: T[];
  value: T;
  onValueChange: (v: T) => void;
  testID?: string;
}

export function Picker<T extends PickerItem>({ data, value, onValueChange, testID }: Props<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const index = Math.max(
      0,
      data.findIndex((d) => d.value === value.value),
    );
    node.scrollTop = index * node.clientHeight;

    const handleScrollEnd = () => {
      const i = Math.round(node.scrollTop / node.clientHeight);
      const clamped = Math.max(0, Math.min(i, data.length - 1));
      if (data[clamped].value !== value.value) {
        onValueChange(data[clamped]);
      }
    };

    node.addEventListener("scrollend", handleScrollEnd);
    return () => node.removeEventListener("scrollend", handleScrollEnd);
  }, [data, value, onValueChange]);

  return (
    <div
      ref={scrollRef}
      data-testid={testID}
      className="h-23.25 w-full cursor-ns-resize snap-y snap-mandatory overflow-y-scroll rounded-md border border-black-100 bg-white-200 scrollbar-none"
    >
      {data.map((item) => (
        <div
          key={String(item.value)}
          className="flex h-22.5 snap-start items-center justify-center"
        >
          <span className="select-none truncate font-semibold text-[72px] leading-none text-black-100">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
