"use client";

import Link from "next/link";
import { Home } from "lucide-react";

interface BackToHomeProps {
  label?: string;
}

export function BackToHome({ label = "Volver al inicio" }: BackToHomeProps) {
  return (
    <Link
      href="/"
      className="inline-flex min-h-[44px] items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      aria-label={label}
      data-testid="back-to-home"
    >
      <Home className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
