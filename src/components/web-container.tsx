import { Platform, View } from "react-native";

import { createStyles } from "utils/theme";

export function WebContainer({ children }: { children: React.ReactNode }) {
  const s = useStyles();

  if (Platform.OS !== "web") return <>{children}</>;

  return (
    <View style={s.root}>
      <View style={s.container}>{children}</View>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  root: {
    flex: 1,
    alignItems: "center",
  },
  container: {
    ...t.shadow,
    flex: 1,
    width: "100%",
    maxWidth: 430,
    backgroundColor: t.colors.background,
  },
}));
