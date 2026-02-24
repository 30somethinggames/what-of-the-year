import type { TOPIC_KEY } from "constants/topics";
interface ShadowOffset {
  width: number;
  height: number;
}
export interface Theme {
  topic: {
    color: string;
  };
  colors: {
    black100: string;
    blue100: string;
    blue200: string;
    grey100: string;
    red100: string;
    shadow100: string;
    transparent: "transparent";
    white100: string;
    white200: string;
  };
  spacing: {
    sm: number;
    md: number;
    lg: number;
  };
  border: {
    color: string;
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
    shadow: {
      textShadowColor: string;
      textShadowOffset: ShadowOffset;
      textShadowRadius: number;
    };
    size: {
      sm: number;
      md: number;
      lg: number;

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
    shadowColor: string;
    shadowOffset: ShadowOffset;
    shadowOpacity: number;
    shadowRadius: number;
  };
}

export type ThemeName = TOPIC_KEY.GAMES | TOPIC_KEY.MOVIES | TOPIC_KEY.BOOKS;
