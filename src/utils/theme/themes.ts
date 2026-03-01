import type { Theme } from "./types";

export const palette = {
  black100: "#222222",
  blue100: "#3292c9",
  blue200: "#0a3d6b",
  green100: "#32c992",
  grey100: "#666666",
  red100: "#ED4337",
  white100: "#f1efea",
  white200: "#fff",
  yellow100: "#d1c432",
} as const;

export const baseTheme: Theme = {
  topic: { color: palette.blue100 },
  colors: {
    ...palette,
  },
  spacing: {
    sm: 8,
    md: 16,
    lg: 24,
  },
  border: {
    color: palette.black100,
    size: {
      sm: 1,
      md: 1.5,
      lg: 2,
    },
    radius: {
      sm: 4,
      md: 8,
      lg: 12,
    },
  },
  text: {
    shadow: {
      textShadowColor: palette.black100,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 1,
    },
    font: {
      regular: "Inter_400Regular",
      medium: "Inter_500Medium",
      semibold: "Inter_600SemiBold", // - LIKE
      bold: "Inter_700Bold",
    },
    size: {
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
    },
  },
  shadow: {
    shadowColor: palette.black100,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
};

function makeTheme(topicColor: string): Theme {
  return {
    ...baseTheme,
    topic: { color: topicColor },
  };
}

export const themes: Record<"games" | "movies" | "books", Theme> = {
  games: makeTheme(palette.blue100),
  movies: makeTheme(palette.green100),
  books: makeTheme(palette.yellow100),
};
