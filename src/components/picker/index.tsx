import * as Haptics from "expo-haptics";
import { memo, useCallback, useEffect, useRef } from "react";
import { type FlatList, Text } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

import { ITEM_HEIGHT, NUMBER_OF_LINES, useStyles } from "./styles";
import { type NativeItemProps, type PickerItem, type PickerProps } from "./types";
import { getInitialScrollIndex, keyExtractor } from "./utils";

/**
 * Returns the layout metadata for a given item index. Defined outside the
 * component since it only depends on the `ITEM_HEIGHT` constant, making it a
 * stable reference that never triggers FlatList re-renders.
 */
function getItemLayout(_data: unknown, index: number) {
  return { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index };
}

/**
 * A single row in the picker. Fades and scales based on its distance from the
 * currently centered scroll position. The animation runs entirely on the UI
 * thread via `useAnimatedStyle`, so no JS re-renders occur during scroll.
 *
 * Wrapped in `memo` so that React skips re-rendering rows whose `label` and
 * `index` props haven't changed when the parent `Picker` re-renders.
 */
const Item = memo(function Item({ label, index, scrollOffset }: NativeItemProps) {
  const s = useStyles();

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * ITEM_HEIGHT, index * ITEM_HEIGHT, (index + 1) * ITEM_HEIGHT];
    return {
      opacity: interpolate(scrollOffset.value, inputRange, [0.2, 1, 0.2], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(scrollOffset.value, inputRange, [0.8, 1, 0.8], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View style={[s.item, animatedStyle]}>
      <Text style={s.label} numberOfLines={NUMBER_OF_LINES}>
        {label}
      </Text>
    </Animated.View>
  );
});

/**
 * Scroll-based picker for native platforms. Uses a snapping `FlatList` with
 * animated opacity/scale on each row and haptic feedback on selection changes.
 * Syncs to external `value` changes by scrolling programmatically.
 *
 * Performance considerations:
 * - `Item` is memoized to prevent JS re-renders of rows during parent updates.
 * - `getItemLayout` and `keyExtractor` are module-level stable references.
 * - `onScroll` uses `useAnimatedScrollHandler` (runs on UI thread, no JS bridge overhead).
 * - `renderItem` is wrapped in `useCallback` for a stable FlatList prop reference.
 * - The combined `style` array is memoized to avoid creating a new object each render.
 */
export function Picker<T extends PickerItem>({
  data,
  value,
  onValueChange,
  testID,
}: PickerProps<T>) {
  const s = useStyles();
  const flatListRef = useRef<FlatList<T>>(null);
  const scrollOffset = useSharedValue(0);
  const initialScrollIndex = getInitialScrollIndex(data, value);
  const activeIndex = useRef(initialScrollIndex);

  /**
   * Syncs the list scroll position whenever the external `value` prop changes
   * (e.g. parent resets the selection programmatically).
   */
  useEffect(() => {
    const index = data.findIndex((d) => d.value === value.value);
    if (index >= 0 && index !== activeIndex.current) {
      activeIndex.current = index;
      flatListRef.current?.scrollToOffset({ offset: index * ITEM_HEIGHT, animated: true });
    }
  }, [data, value]);

  /**
   * UI-thread scroll handler that keeps `scrollOffset` in sync without
   * crossing the JS bridge on every frame.
   */
  const handleScroll = useAnimatedScrollHandler((e) => {
    scrollOffset.value = e.contentOffset.y;
  });

  /**
   * Fires after the scroll animation settles on a snap point. Derives the
   * selected index from the final offset, triggers haptics, and notifies the
   * parent only when the selection actually changes.
   */
  const handleMomentumScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(index, data.length - 1));
      if (clamped !== activeIndex.current) {
        activeIndex.current = clamped;
        Haptics.selectionAsync();
        onValueChange(data[clamped]);
      }
    },
    [data, onValueChange],
  );

  /**
   * Stable render function for each row. `useCallback` prevents FlatList from
   * treating every render as a full list re-render due to a changed prop reference.
   */
  const renderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => (
      <Item label={item.label} index={index} scrollOffset={scrollOffset} />
    ),
    [scrollOffset],
  );

  return (
    <Animated.FlatList
      ref={flatListRef}
      testID={testID}
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      onScroll={handleScroll}
      onMomentumScrollEnd={handleMomentumScrollEnd}
      scrollEventThrottle={16}
      contentContainerStyle={s.contentContainerStyle}
      style={s.list}
      getItemLayout={getItemLayout}
      initialScrollIndex={initialScrollIndex}
    />
  );
}
