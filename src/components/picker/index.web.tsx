import { memo, useEffect, useRef } from "react";
import { ScrollView, Text, View, type ViewStyle } from "react-native";

import { ITEM_HEIGHT, NUMBER_OF_LINES, useStyles } from "./styles";
import { type ItemProps, type PickerItem, type PickerProps } from "./types";
import { getInitialScrollIndex, keyExtractor } from "./utils";

const Item = memo(function Item({ label }: ItemProps) {
  const s = useStyles();
  // Each child snaps to the start of the scroll container
  const animatedStyle = { scrollSnapAlign: "start" } as unknown as ViewStyle;

  return (
    <View style={[s.item, animatedStyle]}>
      <Text style={s.label} numberOfLines={NUMBER_OF_LINES}>
        {label}
      </Text>
    </View>
  );
});

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
  const initialScrollIndex = getInitialScrollIndex(data, value);
  const activeIndex = useRef(initialScrollIndex);

  /** Syncs the scroll position when `value` changes externally. */
  useEffect(() => {
    const index = data.findIndex((d) => d.value === value.value);
    if (index >= 0 && index !== activeIndex.current) {
      activeIndex.current = index;
      scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    }
  }, [data, value]);

  /**
   * Attaches a native `scrollend` listener to detect when scrolling settles.
   * Separated from the value-sync effect so the listener is only re-attached
   * when `data` or `onValueChange` changes, not on every value update.
   */
  useEffect(() => {
    const node = (
      scrollRef.current as unknown as { getScrollableNode?: () => HTMLElement }
    )?.getScrollableNode?.();
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
    <ScrollView
      ref={scrollRef}
      testID={testID}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      contentOffset={{ x: 0, y: initialScrollIndex * ITEM_HEIGHT }}
      style={[
        s.list,
        // CSS scroll-snap for reliable snapping on web
        {
          scrollSnapType: "y mandatory",
          overflowY: "scroll",
        } as unknown as ViewStyle,
      ]}
    >
      {data.map((item) => (
        <Item key={keyExtractor(item)} label={item.label} />
      ))}
    </ScrollView>
  );
}
