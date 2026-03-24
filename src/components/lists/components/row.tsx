import type { PropsWithChildren } from "react";

export function Row({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-row items-center gap-md rounded-md border border-black-100 bg-white-200 p-sm">
      {children}
    </div>
  );
}
