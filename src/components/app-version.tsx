import Constants from "expo-constants";
import { Text } from "react-native";

import { createStyles } from "utils/theme";

export function AppVersion() {
  const s = useStyles();
  const version = Constants.expoConfig?.version ?? "0.0.1";
  return <Text style={s.version}>v{version}</Text>;
}

const useStyles = createStyles((t) => ({
  version: {
    fontFamily: t.text.font.regular,
    fontSize: t.text.size.sm,
    color: t.colors.grey100,
    textAlign: "center",
  },
}));
