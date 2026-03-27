import { cn } from "utils/cn";

interface Props {
  onClick?: () => void;
  className?: string;
}

export function SettingsButton({ onClick, className }: Props) {
  return (
    <button
      data-testid="settings-button"
      type="button"
      className={cn("px-sm text-[28px] text-black-100", className)}
      onClick={onClick}
    >
      ☰
    </button>
  );
}
