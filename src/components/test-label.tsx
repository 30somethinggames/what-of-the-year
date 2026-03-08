import { View } from "react-native";

import { createStyles } from "utils/theme";

interface Props {
  testID: string;
  value: string;
}

/**
 * Hidden 1x1 View that exposes a value to Maestro via `accessibilityLabel`.
 * Maestro's `copyTextFrom` requires a visible, accessible element — standard
 * hidden techniques (height: 0, opacity: 0) make the element undiscoverable.
 */
export function TestLabel({ testID, value }: Props) {
  const s = useStyles();

  return <View testID={testID} accessibilityLabel={value} accessible style={s.root} />;
}

const useStyles = createStyles(() => ({
  root: {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
  },
}));
