import { LinearGradient } from "expo-linear-gradient";
import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createStyles } from "utils/theme";

interface Props {
  style?: StyleProp<ViewStyle>;
}

export const Container = ({ children, style }: PropsWithChildren<Props>) => {
  const s = useStyles();
  return (
    <LinearGradient colors={["#7ec8e3", "#0a3d6b"]} style={s.gradient}>
      <SafeAreaView style={[s.root, style]}>{children}</SafeAreaView>
    </LinearGradient>
  );
};

const useStyles = createStyles((t) => ({
  gradient: {
    flex: 1,
  },
  root: {
    flex: 1,
    padding: t.spacing.lg,
  },
}));
