import { useCallback, useRef, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

import { MAX_NAME_LENGTH, sanitizeName, validateName } from "components/input/sanitize";
import type { Option } from "types/option";
import { createStyles } from "utils/theme";

const MAX_RESULTS = 8;

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSelectOption: (option: Option) => void;
  options: Option[];
  placeholder?: string;
  maxLength?: number;
}

/**
 * Text input with autocomplete suggestions from a list of Options.
 *
 * As the user types, matching options are shown in a dropdown.
 * Selecting an option calls `onSelectOption` with the full Option object.
 */
export function Autocomplete({
  value,
  onChangeText,
  onSelectOption,
  options,
  placeholder,
  maxLength = MAX_NAME_LENGTH,
}: Props) {
  const s = useStyles();
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChangeText = useCallback(
    (raw: string) => {
      setError(validateName(raw) ?? "");
      onChangeText(sanitizeName(raw));
      setShowSuggestions(true);
    },
    [onChangeText],
  );

  const query = value.trim().toLowerCase();
  const filtered =
    showSuggestions && query.length >= 2
      ? options.filter((o) => o.name.toLowerCase().includes(query)).slice(0, MAX_RESULTS)
      : [];

  const handleSelect = (option: Option) => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    onChangeText(option.name);
    onSelectOption(option);
    setShowSuggestions(false);
    setError("");
  };

  return (
    <View style={s.wrapper}>
      <TextInput
        style={[s.input, error ? s.inputError : undefined]}
        value={value}
        onChangeText={handleChangeText}
        onFocus={() => {
          if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
          setShowSuggestions(true);
        }}
        onBlur={() => {
          blurTimeoutRef.current = setTimeout(() => setShowSuggestions(false), 150);
        }}
        placeholder={placeholder}
        placeholderTextColor={s.placeholder.color}
        maxLength={maxLength}
        autoCorrect={false}
        autoCapitalize="words"
      />
      {error ? <Text style={s.error}>{error}</Text> : null}
      {filtered.length > 0 && (
        <View style={s.dropdown}>
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable style={s.suggestion} onPress={() => handleSelect(item)}>
                <Text style={s.suggestionText} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.rating != null && (
                  <Text style={s.suggestionMeta}>{Math.round(item.rating)}</Text>
                )}
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  wrapper: {
    width: "100%",
    gap: t.spacing.sm / 2,
    zIndex: 1,
  },
  input: {
    width: "100%",
    backgroundColor: t.colors.surface,
    borderWidth: t.border.size.md,
    borderColor: t.colors.primary,
    borderRadius: t.border.radius.md,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    fontSize: t.text.size.md,
    color: t.colors.primary,
  },
  inputError: {
    borderColor: t.colors.error,
  },
  placeholder: {
    color: t.colors.secondary,
  },
  error: {
    color: t.colors.error,
    fontSize: t.text.size.sm,
    paddingHorizontal: t.spacing.sm,
  },
  dropdown: {
    backgroundColor: t.colors.surface,
    borderWidth: t.border.size.md,
    borderColor: t.colors.primary,
    borderRadius: t.border.radius.md,
    maxHeight: 240,
    overflow: "hidden",
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    gap: t.spacing.sm,
  },
  suggestionText: {
    flex: 1,
    fontSize: t.text.size.md,
    color: t.colors.primary,
  },
  suggestionMeta: {
    fontSize: t.text.size.sm,
    color: t.colors.secondary,
  },
}));
