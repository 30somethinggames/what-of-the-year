import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef } from "react";
import { FlatList, Text } from "react-native";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

import { useStyles } from "./styles";
import { ITEM_HEIGHT, type PickerItem, type PickerProps } from "./types";

/**
 * Native picker using `FlatList` with `snapToInterval` and `react-native-reanimated`
 * for smooth opacity/scale animations. Provides haptic feedback on selection changes.
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
  const activeIndex = useRef(data.findIndex((d) => d.value === value.value));
  const isUserScroll = useRef(false);

  // Sync scroll position when value changes externally
  useEffect(() => {
    const index = data.findIndex((d) => d.value === value.value);
    if (index >= 0 && index !== activeIndex.current) {
      activeIndex.current = index;
      flatListRef.current?.scrollToOffset({ offset: index * ITEM_HEIGHT, animated: true });
    }
  }, [data, value]);

  const handleScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      scrollOffset.value = e.nativeEvent.contentOffset.y;
    },
    [scrollOffset],
  );

  const handleScrollBeginDrag = useCallback(() => {
    isUserScroll.current = true;
  }, []);

  const handleMomentumScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      if (!isUserScroll.current) return;
      isUserScroll.current = false;

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

  const renderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => (
      <PickerItemRow label={item.label} index={index} scrollOffset={scrollOffset} />
    ),
    [scrollOffset],
  );

  const keyExtractor = useCallback((item: T) => String(item.value), []);

  return (
    <Animated.FlatList
      ref={flatListRef as unknown as React.RefObject<Animated.FlatList<T>>}
      testID={testID}
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      onScroll={handleScroll}
      onScrollBeginDrag={handleScrollBeginDrag}
      onMomentumScrollEnd={handleMomentumScrollEnd}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingVertical: 0 }}
      style={[s.list, { height: ITEM_HEIGHT }]}
      getItemLayout={(_data, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })}
      initialScrollIndex={Math.max(
        0,
        data.findIndex((d) => d.value === value.value),
      )}
    />
  );
}

/**
 * An individual row within the native picker. Animates its opacity and scale
 * based on proximity to the currently centered scroll position.
 */
function PickerItemRow({
  label,
  index,
  scrollOffset,
}: {
  /** Display text for this row. */
  label: string;
  /** Position of this row in the data array. */
  index: number;
  /** Shared scroll offset used to drive the entrance/exit animations. */
  scrollOffset: SharedValue<number>;
}) {
  const s = useStyles();

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * ITEM_HEIGHT, index * ITEM_HEIGHT, (index + 1) * ITEM_HEIGHT];

    const opacity = interpolate(scrollOffset.value, inputRange, [0.2, 1, 0.2], Extrapolation.CLAMP);

    const scale = interpolate(scrollOffset.value, inputRange, [0.8, 1, 0.8], Extrapolation.CLAMP);

    return { opacity, transform: [{ scale }] };
  });

  return (
    <Animated.View style={[s.item, animatedStyle]}>
      <Text style={s.label} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}
