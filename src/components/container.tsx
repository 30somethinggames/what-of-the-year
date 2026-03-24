import type { ReactNode } from "react";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function Container({ children, className, ...rest }: Props) {
  return (
    <div className={`flex flex-1 flex-col px-md pb-md bg-white-100 ${className ?? ""}`} {...rest}>
      {children}
    </div>
  );
}
