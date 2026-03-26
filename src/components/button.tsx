import { cn } from "utils/cn";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  testID?: string;
  style?: React.CSSProperties;
}

export function Button({ label, disabled, style, testID, className, ...props }: Props) {
  return (
    <button
      type="button"
      data-testid={testID}
      disabled={disabled}
      className={cn(
        "w-full rounded-lg py-md bg-topic text-white-200 font-semibold text-xl text-center transition-opacity [text-shadow:0px_0px_1px_var(--color-black-100)] active:opacity-70 disabled:opacity-50 disabled:cursor-default",
        className,
      )}
      style={style}
      {...props}
    >
      {label}
    </button>
  );
}
