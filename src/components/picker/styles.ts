import { Platform, type ViewStyle } from "react-native";

import { createStyles } from "utils/theme";

/** Height in pixels for each picker row. Used for snap intervals and layout calculations. */
export const ITEM_HEIGHT = 90;
export const NUMBER_OF_LINES = 1;

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
