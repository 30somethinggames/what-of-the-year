import { Platform, type ViewStyle } from "react-native";

import { ITEM_HEIGHT } from "./types";
import { createStyles } from "utils/theme";

export const useStyles = createStyles((t) => ({
  list: {
    flexGrow: 0,
    width: "100%",
    height: ITEM_HEIGHT,
    borderRadius: t.border.radius.md,
    borderWidth: t.border.size.sm,
    backgroundColor: t.colors.white200,
    overflow: "hidden",
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
    fontFamily: t.text.font.semibold,
    fontSize: 72,
    color: t.colors.black100,
  },
  contentContainerStyle: {
    paddingVertical: 0,
  },
}));
