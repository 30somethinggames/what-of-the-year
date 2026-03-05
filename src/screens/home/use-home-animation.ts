import { useEffect } from "react";
import { Dimensions } from "react-native";
import {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Drives the home screen entrance animation.
 *
 * Sequence:
 * 1. Background cycles through all topic colors
 * 2. "of" pops in with a spring scale
 * 3. Topic pill slides in from the left with a bounce
 * 4. Year pill slides in from the right, slightly delayed
 * 5. Start button fades up from below
 */
export function useHomeAnimation() {
  const topicX = useSharedValue(-SCREEN_WIDTH);
  const yearX = useSharedValue(SCREEN_WIDTH);
  const ofOpacity = useSharedValue(0);
  const ofScale = useSharedValue(0.5);
  const btnOpacity = useSharedValue(0);
  const btnTranslateY = useSharedValue(20);

  useEffect(() => {
    ofOpacity.value = withTiming(1, { duration: 200 });
    ofScale.value = withSpring(1, { damping: 12, stiffness: 300 });

    topicX.value = withDelay(500, withSpring(0, { damping: 20, stiffness: 300, mass: 0.8 }));
    yearX.value = withDelay(650, withSpring(0, { damping: 20, stiffness: 300, mass: 0.8 }));

    btnOpacity.value = withDelay(950, withTiming(1, { duration: 400 }));
    btnTranslateY.value = withDelay(950, withSpring(0, { damping: 14, stiffness: 120 }));
  }, []);

  const topicStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: topicX.value }],
  }));

  const yearStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: yearX.value }],
  }));

  const ofStyle = useAnimatedStyle(() => ({
    opacity: ofOpacity.value,
    transform: [{ scale: ofScale.value }],
  }));

  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
    transform: [{ translateY: btnTranslateY.value }],
  }));

  return { topicStyle, yearStyle, ofStyle, btnStyle };
}
