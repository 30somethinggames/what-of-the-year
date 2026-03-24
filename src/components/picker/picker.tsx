import { memo, useEffect, useRef } from "react";

import { ITEM_HEIGHT } from "./styles";
import type { PickerItem, PickerProps } from "./types";
import { getInitialScrollIndex, keyExtractor } from "./utils";

const Item = memo(function Item({ label }: { label: string }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{ height: ITEM_HEIGHT, scrollSnapAlign: "start" }}
    >
      <span className="select-none font-semibold text-[72px] leading-none text-black-100 truncate">
        {label}
      </span>
    </div>
  );
});

export function Picker<T extends PickerItem>({
  data,
  value,
  onValueChange,
  testID,
}: PickerProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialScrollIndex = getInitialScrollIndex(data, value);
  const activeIndex = useRef(initialScrollIndex);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = initialScrollIndex * ITEM_HEIGHT;
    }
  }, []);

  useEffect(() => {
    const index = data.findIndex((d) => d.value === value.value);
    if (index >= 0 && index !== activeIndex.current) {
      activeIndex.current = index;
      scrollRef.current?.scrollTo({ top: index * ITEM_HEIGHT, behavior: "smooth" });
    }
  }, [data, value]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const handleScrollEnd = () => {
      const snappedIndex = Math.round(node.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(snappedIndex, data.length - 1));
      if (clamped !== activeIndex.current) {
        activeIndex.current = clamped;
        onValueChange(data[clamped]);
      }
    };

    node.addEventListener("scrollend", handleScrollEnd);
    return () => node.removeEventListener("scrollend", handleScrollEnd);
  }, [data, onValueChange]);

  return (
    <div
      ref={scrollRef}
      data-testid={testID}
      className="w-full cursor-ns-resize rounded-md border border-black-100 bg-white-200 scrollbar-none"
      style={{
        height: ITEM_HEIGHT + 3,
        overflowY: "scroll",
        scrollSnapType: "y mandatory",
      }}
    >
      {data.map((item) => (
        <Item key={keyExtractor(item)} label={item.label} />
      ))}
    </div>
  );
}
