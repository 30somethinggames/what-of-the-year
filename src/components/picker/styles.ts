import { Platform, type ViewStyle } from "react-native";

import { ITEM_HEIGHT } from "./types";
import { createStyles } from "utils/theme";

export const useStyles = createStyles((t) => ({
  list: {
    flexGrow: 0,
    width: "100%",
    height: ITEM_HEIGHT,
    backgroundColor: t.colors.background,
    ...Platform.select({
      web: {
        cursor: "ns-resize",
      } as unknown as ViewStyle,
    }),
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: t.text.size.title,
    fontWeight: t.text.weight.bold,
    color: t.colors.primary,
  },
  contentContainerStyle: {
    paddingVertical: 0,
  },
}));
