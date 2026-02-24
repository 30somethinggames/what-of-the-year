import { useLocalSearchParams } from "expo-router";
import type { ImageStyle, TextStyle, ViewStyle } from "react-native";

import { baseTheme, themes } from "./themes";
import type { Theme } from "./types";

type Style = ViewStyle | TextStyle | ImageStyle | Record<string, unknown>;
type NamedStyles<T> = { [K in keyof T]: Style };
type TopicKey = keyof typeof themes;

/**
 * Creates a `useStyles` hook that resolves the current theme and returns
 * computed styles.
 *
 * The theme is determined by the `topic` URL param from expo-router.
 * Falls back to {@link baseTheme} when no topic is present (e.g. home screen).
 *
 * @param stylesFn - A function that receives the resolved {@link Theme} and
 *   an optional params object, then returns a named styles object.
 * @returns A `useStyles` hook: `(params?: P) => T`
 *
 * @example
 * ```ts
 * // Without params
 * const useStyles = createStyles((t) => ({
 *   root: { flex: 1, backgroundColor: t.colors.white100 },
 * }));
 * const s = useStyles();
 *
 * // With params
 * const useStyles = createStyles((t, p: { color: string }) => ({
 *   btn: { backgroundColor: p.color },
 * }));
 * const s = useStyles({ color: "#fff" });
 * ```
 */
export function createStyles<T extends NamedStyles<T>, P = void>(
  stylesFn: (theme: Theme, params: P) => T,
) {
  return (...args: P extends void ? [] : [P]) => {
    const { topic } = useLocalSearchParams<{ topic?: string }>();
    const theme = (topic && themes[topic as TopicKey]) || baseTheme;
    return stylesFn(theme, args[0] as P) as T;
  };
}
