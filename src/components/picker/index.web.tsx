import { useEffect, useRef } from "react";
import { ScrollView, Text, View, type ViewStyle } from "react-native";

import { useStyles } from "./styles";
import { ITEM_HEIGHT, type PickerItem, type PickerProps } from "./types";

/**
 * Web picker using a `ScrollView` with CSS `scroll-snap-type` for native-feeling
 * snap behavior. Listens for the `scrollend` event to detect the final resting
 * position and notify the parent of value changes.
 */
export function Picker<T extends PickerItem>({
  data,
  value,
  onValueChange,
  testID,
}: PickerProps<T>) {
  const s = useStyles();
  const scrollRef = useRef<ScrollView>(null);
  const activeIndex = useRef(data.findIndex((d) => d.value === value.value));

  // Sync scroll position when value changes externally
  useEffect(() => {
    const index = data.findIndex((d) => d.value === value.value);
    if (index >= 0 && index !== activeIndex.current) {
      activeIndex.current = index;
      scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    }
  }, [data, value]);

  // Attach a native `scrollend` listener to reliably detect when scrolling settles
  useEffect(() => {
    const node = (
      scrollRef.current as unknown as { getScrollableNode?: () => HTMLElement }
    )?.getScrollableNode?.();
    if (!node) return;

    const handleScrollEnd = () => {
      const index = Math.round(node.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(index, data.length - 1));

      if (clamped !== activeIndex.current) {
        activeIndex.current = clamped;
        onValueChange(data[clamped]);
      }
    };

    node.addEventListener("scrollend", handleScrollEnd);
    return () => node.removeEventListener("scrollend", handleScrollEnd);
  }, [data, onValueChange]);

  return (
    <ScrollView
      ref={scrollRef}
      testID={testID}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      contentOffset={{
        x: 0,
        y:
          Math.max(
            0,
            data.findIndex((d) => d.value === value.value),
          ) * ITEM_HEIGHT,
      }}
      style={[
        s.list,
        { height: ITEM_HEIGHT },
        // CSS scroll-snap for reliable snapping on web
        {
          scrollSnapType: "y mandatory",
          overflowY: "scroll",
        } as unknown as ViewStyle,
      ]}
    >
      {data.map((item) => (
        <View
          key={String(item.value)}
          style={[
            s.item,
            // Each child snaps to the start of the scroll container
            { scrollSnapAlign: "start" } as unknown as ViewStyle,
          ]}
        >
          <Text style={s.label} numberOfLines={1}>
            {item.label}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
