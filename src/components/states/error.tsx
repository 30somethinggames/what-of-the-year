import { Avatar } from "../avatar";
import { Button } from "../button";

const SAD_ROBOT = "https://api.dicebear.com/7.x/bottts/svg?seed=sad";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function Error({ message = "Something went wrong", onRetry }: Props) {
  return (
    <div className="flex flex-1 flex-row items-center justify-center gap-lg px-lg">
      <Avatar source={SAD_ROBOT} size={80} />
      <div className="flex shrink flex-col gap-md">
        <p className="font-medium text-lg text-black-100">{message}</p>
        {onRetry ? <Button label="Retry" onClick={onRetry} /> : null}
      </div>
    </div>
  );
}
