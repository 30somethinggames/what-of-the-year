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
    green100: string;
    grey100: string;
    red100: string;
    shadow100: string;
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
    shadow: {
      textShadowColor: string;
      textShadowOffset: ShadowOffset;
      textShadowRadius: number;
    };
    size: {
      sm: number;
      md: number;
      lg: number;
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
