import type { FC } from "react";
import type { KeyboardAvoidingViewProps } from "react-native";
import { KeyboardAvoidingView as RNKeyboardAvoidingView, Platform } from "react-native";

const baseBehavior = Platform.OS === "ios" ? "padding" : "height";

export const KeyboardAvoidingView: FC<KeyboardAvoidingViewProps> = ({
  children,
  behavior = baseBehavior,
  ...rest
}) => {
  return (
    <RNKeyboardAvoidingView behavior={behavior} {...rest}>
      {children}
    </RNKeyboardAvoidingView>
  );
};
