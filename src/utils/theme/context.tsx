import { useLocalSearchParams } from "expo-router";
import React, { createContext, useContext, useState, type ReactNode } from "react";

import { baseTheme, themes } from "./themes";
import type { Theme, ThemeName } from "./types";
import { TOPIC_KEY } from "constants/topics";

interface ThemeContextValue {
  fallbackTopic: TOPIC_KEY;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [fallbackTopic, setFallbackTopic] = useState<TOPIC_KEY>(TOPIC_KEY.GAMES);

  return (
    <ThemeContext.Provider value={{ fallbackTopic, setTheme: setFallbackTopic }}>
      {children}
    </ThemeContext.Provider>
  );
}

interface UseThemeResult {
  theme: Theme;
  themeName: TOPIC_KEY;
  setTheme: (name: ThemeName) => void;
}

export function useTheme(): UseThemeResult {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  const { topic: urlTopic } = useLocalSearchParams<{ topic?: string }>();
  const resolvedTopic = (urlTopic as TOPIC_KEY) ?? context.fallbackTopic;
  const theme = themes[resolvedTopic] ?? baseTheme;

  return { theme, themeName: resolvedTopic, setTheme: context.setTheme };
}
