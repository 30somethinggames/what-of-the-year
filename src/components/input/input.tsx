import { cn } from "utils/cn";

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  error?: string;
  testID?: string;
  onChangeText?: (text: string) => void;
}

export function Input({ error, testID, onChangeText, className, ...rest }: Props) {
  return (
    <div className="w-full">
      <input
        data-testid={testID}
        autoComplete="off"
        className={cn(
          "w-full bg-white-200 border border-black-100 rounded-md px-md py-sm text-md text-black-100 placeholder:text-grey-100 outline-none",
          error && "border-red-100",
          className,
        )}
        onChange={onChangeText ? (e) => onChangeText(e.target.value) : undefined}
        {...rest}
      />
    </div>
  );
}
