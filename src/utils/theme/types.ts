interface ShadowOffset {
  width: number;
  height: number;
}

type BoxShadow =
  | { boxShadow: string }
  | {
      shadowColor: string;
      shadowOffset: ShadowOffset;
      shadowOpacity: number;
      shadowRadius: number;
    };

type TextShadow =
  | { textShadow: string }
  | {
      textShadowColor: string;
      textShadowOffset: ShadowOffset;
      textShadowRadius: number;
    };

export interface Theme {
  topic: {
    color: string;
  };
  colors: {
    black100: string;
    blue100: string;
    blue200: string;
    green100: string;
    grey100: string;
    red100: string;
    white100: string;
    white200: string;
    yellow100: string;
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
    shadow: TextShadow;
    font: {
      regular: string;
      medium: string;
      semibold: string;
      bold: string;
    };
    size: {
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
  };
  shadow: BoxShadow;
}
