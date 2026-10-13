import { ReactNode } from "react";

export interface LinkProps {
  href?: string;
  children?: ReactNode;
  className?: string;
}

export function Link({ href, children, className }: LinkProps) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
