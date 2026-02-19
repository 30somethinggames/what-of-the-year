import { tintColor } from "./tintColor";
import type { Theme } from "./types";

const PRIMARY = "#000000";
const SECONDARY = "#666666";

const baseSpacing = {
  sm: 8,
  md: 16,
  lg: 24,
};

const baseBorder = {
  size: {
    sm: 0.5,
    md: 1,
    lg: 1.5,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
};

const baseText = {
  color: {
    primary: PRIMARY,
    secondary: SECONDARY,
  },
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
  background: "#fff",
  backgroundSecondary: "#F0F0F0",
  surface: "#F5F5F5",
  error: "#DC2626",
  success: "#16A34A",
};

const baseCollections = {
  spacing: baseSpacing,
  border: baseBorder,
  text: baseText,
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
};

export const gamesTheme: Theme = {
  ...baseCollections,
  colors: {
    primary: PRIMARY,
    ...baseColors,
  },
};

export const moviesTheme: Theme = {
  ...baseCollections,
  colors: {
    primary: tintColor(PRIMARY, "#3B82F6", 0.3),
    ...baseColors,
  },
};

export const booksTheme: Theme = {
  ...baseCollections,
  colors: {
    primary: tintColor(PRIMARY, "#3bf673", 0.3),
    ...baseColors,
  },
};

export const themes = {
  games: gamesTheme,
  movies: moviesTheme,
  books: booksTheme,
};
