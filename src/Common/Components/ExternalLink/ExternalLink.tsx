import type { ReactNode } from "react";
import { useExternalLink } from "../../../Services/externalLink";

export interface ExternalLinkProps {
  href: string;
  label: string;
  className?: string;
  children?: ReactNode;
}

export default function ExternalLink({
  href,
  label,
  className,
  children,
}: ExternalLinkProps) {
  const { request } = useExternalLink();

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
      onClick={(e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
          return;
        e.preventDefault();
        request(href, label);
      }}
    >
      {children}
    </a>
  );
}
