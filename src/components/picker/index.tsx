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

interface ItemProps {
  /** Display text for the row. */
  label: string;
  /** Position in the data array, used to calculate scroll-based animations. */
  index: number;
  /** Shared scroll offset that drives opacity and scale animations. */
  scrollOffset: SharedValue<number>;
}

/**
 * A single row in the picker. Fades and scales based on its distance
 * from the currently centered scroll position.
 */
function Item({ label, index, scrollOffset }: ItemProps) {
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
      <Text style={s.label} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}

/**
 * Scroll-based picker for native platforms. Uses a snapping `FlatList` with
 * animated opacity/scale on each row and haptic feedback on selection changes.
 * Syncs to external `value` changes by scrolling programmatically.
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

  useEffect(() => {
    const index = data.findIndex((d) => d.value === value.value);
    if (index >= 0 && index !== activeIndex.current) {
      activeIndex.current = index;
      flatListRef.current?.scrollToOffset({ offset: index * ITEM_HEIGHT, animated: true });
    }
  }, [data, value]);

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

  return (
    <Animated.FlatList
      ref={flatListRef}
      testID={testID}
      data={data}
      keyExtractor={(item) => String(item.value)}
      renderItem={({ item, index }) => (
        <Item label={item.label} index={index} scrollOffset={scrollOffset} />
      )}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      onScroll={(e) => {
        scrollOffset.value = e.nativeEvent.contentOffset.y;
      }}
      onMomentumScrollEnd={handleMomentumScrollEnd}
      scrollEventThrottle={16}
      contentContainerStyle={s.contentContainerStyle}
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
