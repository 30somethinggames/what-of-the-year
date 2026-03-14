import { useEffect } from "react";
import { Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { haptics } from "utils/haptics";
import { createStyles } from "utils/theme";

import type { ToastVariant } from "./toast-provider";

const DISMISS_MS = 3000;
const EXIT_MS = 300;
const TOAST_GAP = 8;
const TOAST_HEIGHT = 56;

interface Props {
  id: string;
  message: string;
  variant: ToastVariant;
  index: number;
  onRemove: (id: string) => void;
}

export function Toast({ id, message, variant, index, onRemove }: Props) {
  const insets = useSafeAreaInsets();
  const targetTop = insets.top + TOAST_GAP + index * (TOAST_HEIGHT + TOAST_GAP);
  const s = useStyles({ variant });

  const animatedTop = useSharedValue(targetTop);
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    animatedTop.value = withSpring(targetTop, { damping: 60, stiffness: 400 });
  }, [targetTop, animatedTop]);

  useEffect(() => {
    haptics.light();
    translateY.value = withSpring(0, { damping: 60, stiffness: 400 });
    opacity.value = withTiming(1, { duration: 200 });

    const timeout = setTimeout(() => {
      opacity.value = withTiming(0, { duration: EXIT_MS });
      translateY.value = withTiming(-100, { duration: EXIT_MS }, () => {
        scheduleOnRN(onRemove, id);
      });
    }, DISMISS_MS);

    return () => clearTimeout(timeout);
  }, [id, onRemove, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    top: animatedTop.value,
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[s.root, animatedStyle]}>
      <Text style={s.message}>{message}</Text>
    </Animated.View>
  );
}

const useStyles = createStyles((t, p: { variant: ToastVariant }) => {
  const accentColor = {
    info: t.colors.blue100,
    success: t.colors.green100,
    error: t.colors.red100,
  }[p.variant];

  return {
    root: {
      position: "absolute",
      left: t.spacing.md,
      right: t.spacing.md,
      minHeight: TOAST_HEIGHT,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.colors.white200,
      borderRadius: t.border.radius.lg,
      borderLeftWidth: 4,
      borderLeftColor: accentColor,
      ...t.shadow,
    },
    message: {
      flex: 1,
      fontFamily: t.text.font.medium,
      fontSize: t.text.size.md,
      color: t.colors.black100,
      paddingVertical: t.spacing.md,
      paddingHorizontal: t.spacing.md,
    },
  };
});
