import { LinearGradient } from "expo-linear-gradient";
import { type PropsWithChildren } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createStyles, useTheme } from "utils/theme";

interface Props {
  style?: StyleProp<ViewStyle>;
}

export const Container = ({ children, style }: PropsWithChildren<Props>) => {
  const { theme } = useTheme();
  const s = useStyles();

  return (
    <LinearGradient colors={[theme.colors.blue100, theme.colors.blue200]} style={s.gradient}>
      <SafeAreaView edges={["bottom"]} style={[s.root, style]}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
};

const useStyles = createStyles((t) => ({
  gradient: {
    flex: 1,
  },
  root: {
    flex: 1,
    padding: t.spacing.md,
  },
}));
