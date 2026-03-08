import { type PropsWithChildren } from "react";
import { View } from "react-native";

import { createStyles } from "utils/theme";

export const Row = ({ children }: PropsWithChildren) => {
  const s = useStyles();
  return <View style={s.root}>{children}</View>;
};

const useStyles = createStyles((t) => ({
  root: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: t.colors.white200,
    padding: t.spacing.sm,
    borderRadius: t.border.radius.md,
    borderWidth: t.border.size.sm,
    gap: t.spacing.md,
  },
}));
