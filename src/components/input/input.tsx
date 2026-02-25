import { TextInput, type TextInputProps, View } from "react-native";

import { createStyles } from "utils/theme";

interface Props extends TextInputProps {
  error?: string;
}
export function Input({
  value,
  onChangeText,
  placeholder,
  maxLength,
  error,
  style,
  ...rest
}: Props) {
  const s = useStyles();

  return (
    <View style={s.wrapper}>
      <TextInput
        style={[s.root, error ? s.rootError : undefined, style]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={s.placeholder.color}
        maxLength={maxLength}
        autoCorrect={false}
        autoCapitalize="words"
        {...rest}
      />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  wrapper: {
    width: "100%",
    gap: t.spacing.sm / 2,
  },
  root: {
    width: "100%",
    backgroundColor: t.colors.white200,
    borderWidth: t.border.size.sm,
    borderColor: t.colors.black100,
    borderRadius: t.border.radius.md,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    fontSize: t.text.size.md,
    color: t.colors.black100,
  },
  rootError: {
    borderColor: t.colors.red100,
  },
  placeholder: {
    color: t.colors.grey100,
  },
}));
