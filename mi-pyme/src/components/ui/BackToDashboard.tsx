"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackToDashboardProps {
  href: string;
  label?: string;
}

export function BackToDashboard({ href, label = "Volver al dashboard" }: BackToDashboardProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 min-h-[44px] min-w-[44px]"
      aria-label={label}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
