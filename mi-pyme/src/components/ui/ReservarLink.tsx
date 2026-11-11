"use client";

import Link from "next/link";

interface ReservarLinkProps {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}

export function ReservarLink({ href, disabled, children }: ReservarLinkProps) {
  return (
    <Link
      href={href}
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </Link>
  );
}
