import { Avatar } from "../avatar";
import { Button } from "../button";

const SAD_ROBOT = "https://api.dicebear.com/7.x/bottts/svg?seed=sad";

interface Props {
  message?: string;
  onRetry?: () => void;
  onHome?: () => void;
}

export function DisplayError({ message = "Something went wrong", onRetry, onHome }: Props) {
  return (
    <div
      data-testid="error-state"
      className="flex flex-1 flex-row items-center justify-center gap-lg px-lg"
    >
      <Avatar source={SAD_ROBOT} size={80} />
      <div className="flex shrink flex-col gap-md">
        <p className="font-medium text-lg text-black-100">{message}</p>
        {onRetry ? <Button testID="error-retry" label="Retry" onClick={onRetry} /> : null}
        {onHome ? <Button testID="error-home" label="Home" onClick={onHome} /> : null}
      </div>
    </div>
  );
}
