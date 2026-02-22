import { useHeaderHeight } from "@react-navigation/elements";
import type { FC } from "react";
import type { KeyboardAvoidingViewProps } from "react-native";
import { KeyboardAvoidingView as RNKeyboardAvoidingView, Platform } from "react-native";

const baseBehavior = Platform.OS === "ios" ? "padding" : "height";

export const KeyboardAvoidingView: FC<KeyboardAvoidingViewProps> = ({
  children,
  behavior = baseBehavior,
  ...rest
}) => {
  const headerHeight = useHeaderHeight();
  return (
    <RNKeyboardAvoidingView behavior={behavior} keyboardVerticalOffset={headerHeight} {...rest}>
      {children}
    </RNKeyboardAvoidingView>
  );
};
