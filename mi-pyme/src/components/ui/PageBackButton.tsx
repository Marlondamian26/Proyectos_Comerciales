"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";

interface PageBackButtonProps {
  rol: "CLIENTE" | "NEGOCIO" | "LOGISTICA" | "ADMIN";
}

const DASHBOARD_PATHS: Record<string, string> = {
  CLIENTE: "/cliente",
  NEGOCIO: "/negocio",
  LOGISTICA: "/logistica",
  ADMIN: "/admin",
};

export function PageBackButton({ rol }: PageBackButtonProps) {
  const pathname = usePathname();
  const dashboardPath = DASHBOARD_PATHS[rol];

  const isDashboardRoot = pathname === dashboardPath;

  if (isDashboardRoot) {
    return (
      <Link
        href="/"
        className="inline-flex min-h-[44px] items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground mb-6"
        aria-label="Volver al inicio"
        data-testid="back-to-home"
      >
        <Home className="h-4 w-4" />
        Volver al inicio
      </Link>
    );
  }

  return (
    <Link
      href={dashboardPath}
      className="inline-flex min-h-[44px] items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground mb-6"
      aria-label="Volver al dashboard"
      data-testid="back-to-dashboard"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver al dashboard
    </Link>
  );
}
