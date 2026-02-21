import { tintColor } from "./tintColor";
import type { Theme } from "./types";

const SECONDARY = "#666666";
const black100 = "#000000";
export const white100 = "#fff";
export const blue100 = "#7ec8e3";
const blue200 = "#0a3d6b";

const baseSpacing = {
  sm: 8,
  md: 16,
  lg: 24,
};

const baseBorder = {
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
};

const baseText = {
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    title: 72,
  },
  weight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
};

const baseColors = {
  secondary: SECONDARY,
  background: white100,
  backgroundSecondary: "#F0F0F0",
  surface: "#F5F5F5",
  error: "#DC2626",
  success: "#16A34A",
  transparent: "transparent",
  black100,
  white100,
  blue100,
  blue200,
};

const baseCollections = {
  spacing: baseSpacing,
  border: baseBorder,
  text: baseText,
  shadow: {
    shadowColor: black100,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
};

export const gamesTheme: Theme = {
  ...baseCollections,
  colors: {
    primary: black100,
    ...baseColors,
  },
};

export const moviesTheme: Theme = {
  ...baseCollections,
  colors: {
    primary: tintColor(black100, "#3B82F6", 0.3),
    ...baseColors,
  },
};

export const booksTheme: Theme = {
  ...baseCollections,
  colors: {
    primary: tintColor(black100, "#3bf673", 0.3),
    ...baseColors,
  },
};

export const themes = {
  games: gamesTheme,
  movies: moviesTheme,
  books: booksTheme,
};
