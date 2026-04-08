import { useCallback, useEffect, useRef, useState } from "react";

import type { Option } from "types/option";

import { Input } from "../input";
import { filterOptions } from "./filter-options";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSelectOption: (option: Option) => void;
  options: Option[];
  placeholder: string;
  testID?: string;
}

export function Autocomplete({
  value,
  placeholder,
  onChangeText,
  onSelectOption,
  options,
  testID,
}: Props) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearBlurTimeout = useCallback(() => {
    if (blurTimeoutRef.current != null) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearBlurTimeout, [clearBlurTimeout]);

  const handleChangeText = useCallback(
    (e: React.ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
      onChangeText(e.target.value);
      setShowSuggestions(true);
    },
    [onChangeText],
  );

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
  };

  const filtered = showSuggestions ? filterOptions(options, value) : [];
  const shouldDisplaySuggestions = showSuggestions && filtered?.length > 0;

  return (
    <div className="relative w-full z-10">
      <Input
        testID={testID}
        value={value}
        onChange={handleChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        autoCorrect="off"
        autoCapitalize="words"
        placeholder={placeholder}
      />
      {shouldDisplaySuggestions ? (
        <div className="mt-1 max-h-60 overflow-y-auto rounded-md border-[1.5px] border-black-100 bg-white-200">
          {filtered.map((item) => (
            <button
              key={String(item.id)}
              data-testid="suggestion-item"
              type="button"
              className="flex w-full flex-row items-center gap-sm p-sm text-left hover:bg-white-100"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(item)}
            >
              <span className="flex-1 truncate text-md text-black-100">{item.name}</span>
              {item.rating != null ? (
                <span className="text-sm text-grey-100">{Math.round(item.rating)}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
