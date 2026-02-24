import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

import { Input } from "./input";
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

  /**
   * Holds the pending blur timeout so it can be cancelled.
   *
   * React Native fires `onBlur` before `onPress` when tapping a suggestion,
   * which would unmount the dropdown before the press registers. To work
   * around this, `onBlur` defers hiding suggestions by a short delay.
   * If the user taps a suggestion within that window, `clearBlurTimeout`
   * cancels the pending hide so the selection goes through.
   *
   * @see clearBlurTimeout
   */
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Cancel any pending blur-hide and null out the ref. */
  const clearBlurTimeout = useCallback(() => {
    if (blurTimeoutRef.current != null) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  }, []);

  /** Clean up on unmount so we never setState after teardown. */
  useEffect(() => clearBlurTimeout, [clearBlurTimeout]);

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

  const onFocus = () => {
    clearBlurTimeout();
    setShowSuggestions(true);
  };

  const onBlur = () => {
    clearBlurTimeout();
    blurTimeoutRef.current = setTimeout(() => {
      blurTimeoutRef.current = null;
      setShowSuggestions(false);
    }, 150);
  };

  const handleSelect = (option: Option) => {
    clearBlurTimeout();
    onChangeText(option.name);
    onSelectOption(option);
    setShowSuggestions(false);
    setError("");
  };

  return (
    <View style={s.root}>
      <Input
        style={[s.input, error ? s.inputError : undefined]}
        value={value}
        onChangeText={handleChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
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
  root: {
    width: "100%",
    gap: t.spacing.sm / 2,
    zIndex: 1,
  },
  input: {
    width: "100%",
    backgroundColor: t.colors.white200,
    borderWidth: t.border.size.md,
    borderColor: t.border.color,
    borderRadius: t.border.radius.md,
    padding: t.spacing.sm,
    fontSize: t.text.size.md,
    color: t.colors.black100,
  },
  inputError: {
    borderColor: t.colors.red100,
  },
  placeholder: {
    color: t.colors.grey100,
  },
  error: {
    color: t.colors.red100,
    fontSize: t.text.size.sm,
    paddingHorizontal: t.spacing.sm,
  },
  dropdown: {
    backgroundColor: t.colors.white200,
    borderWidth: t.border.size.md,
    borderColor: t.colors.black100,
    borderRadius: t.border.radius.md,
    maxHeight: 240,
    overflow: "hidden",
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    padding: t.spacing.sm,
    gap: t.spacing.sm,
  },
  suggestionText: {
    flex: 1,
    fontSize: t.text.size.md,
    color: t.colors.black100,
  },
  suggestionMeta: {
    fontSize: t.text.size.sm,
    color: t.colors.grey100,
  },
}));
