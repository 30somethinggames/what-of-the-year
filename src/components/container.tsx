import { type ReactNode } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createStyles } from "utils/theme";

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Container = ({ children, style }: Props) => {
  const s = useStyles();

  return (
    <SafeAreaView edges={["bottom"]} style={[s.root, style]}>
      {children}
    </SafeAreaView>
  );
};

const useStyles = createStyles((t) => ({
  root: {
    flex: 1,
    padding: t.spacing.md,
    backgroundColor: "#f1efea",
  },
}));
