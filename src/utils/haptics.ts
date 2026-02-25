import * as RNHaptics from "expo-haptics";

export const haptics = {
  /** Subtle tap — use for button presses and small confirmations. */
  light: () => RNHaptics.impactAsync(RNHaptics.ImpactFeedbackStyle.Light),
};
