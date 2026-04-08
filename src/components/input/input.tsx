import { cn } from "utils/cn";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  testID?: string;
}

export function Input({ error, testID, onChange, className, ...rest }: Props) {
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
        onChange={onChange}
        {...rest}
      />
    </div>
  );
}
