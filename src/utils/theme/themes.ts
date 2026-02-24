import type { Theme } from "./types";

const black100 = "#000000";
const blue100 = "#3292c9";
const blue200 = "#0a3d6b";
const grey100 = "#666666";
const red100 = "#ED4337";
const shadow100 = "rgba(0,0,0,0.85)";
const transparent = "transparent" as const;
const white100 = "#f1efea";
const white200 = "#fff";

export const baseTheme: Theme = {
  topic: {
    color: blue100,
  },
  colors: {
    black100,
    grey100,
    blue100,
    blue200,
    red100,
    shadow100,
    transparent,
    white100,
    white200,
  },
  spacing: {
    sm: 8,
    md: 16,
    lg: 24,
  },
  border: {
    color: black100,
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
      textShadowColor: shadow100,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    size: {
      sm: 14,
      md: 16,
      lg: 18,
      title: 72,
    },
    weight: {
      regular: "400" as const,
      medium: "500" as const,
      semibold: "600" as const,
      bold: "700" as const,
    },
  },
  shadow: {
    shadowColor: shadow100,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
};

export const moviesTheme: Theme = {
  ...baseTheme,
  topic: {
    color: "#32c992",
  },
};

export const booksTheme: Theme = {
  ...baseTheme,
  topic: {
    color: "#32c992",
  },
};

export const themes = {
  games: baseTheme,
  movies: moviesTheme,
  books: booksTheme,
};
