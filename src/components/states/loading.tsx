import { ActivityIndicator, type ActivityIndicatorProps, View } from "react-native";

import { createStyles } from "utils/theme";

interface Props extends ActivityIndicatorProps {}

export function Loading({ size = "large", ...props }: Props) {
  const s = useStyles();
  return (
    <View style={s.root}>
      <ActivityIndicator size={size} {...props} />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  root: {
    flex: 1,
    paddingHorizontal: t.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
}));
