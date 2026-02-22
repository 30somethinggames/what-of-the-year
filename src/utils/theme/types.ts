import type { TOPIC_KEY } from "constants/topics";
interface ShadowOffset {
  width: number;
  height: number;
}
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    backgroundSecondary: string;
    surface: string;
    error: string;
    success: string;
    transparent: string;
    black100: string;
    white100: string;
    blue100: string;
    blue200: string;
    yellow100: string;
  };
  spacing: {
    sm: number;
    md: number;
    lg: number;
  };
  border: {
    size: {
      sm: number;
      md: number;
      lg: number;
    };
    radius: {
      sm: number;
      md: number;
      lg: number;
    };
  };
  text: {
    size: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      title: number;
    };
    weight: {
      regular: "400";
      medium: "500";
      semibold: "600";
      bold: "700";
    };
  };
  shadow: {
    container: {
      shadowColor: string;
      shadowOffset: ShadowOffset;
      shadowOpacity: number;
      shadowRadius: number;
    };
    text: {
      textShadowColor: string;
      textShadowOffset: ShadowOffset;
      textShadowRadius: number;
    };
  };
}

export type ThemeName = TOPIC_KEY.GAMES | TOPIC_KEY.MOVIES | TOPIC_KEY.BOOKS;
