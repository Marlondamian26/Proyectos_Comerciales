"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Home } from "lucide-react";

const ROLE_DASHBOARD: Record<string, string> = {
  CLIENTE: "/cliente",
  NEGOCIO: "/negocio",
  LOGISTICA: "/logistica",
  ADMIN: "/admin",
};

export function PageBackButton({
  rol: rolProp,
}: {
  rol?: "CLIENTE" | "NEGOCIO" | "LOGISTICA" | "ADMIN";
}) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const rol = session?.user?.rol as string | undefined;
  const dashboardPath = rol ? ROLE_DASHBOARD[rol] : undefined;

  // Sin sesión → siempre "Volver al inicio"
  if (!session) {
    return (
      <Link
        href="/"
        className="inline-flex min-h-[44px] items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Volver al inicio"
        data-testid="back-to-home"
      >
        <Home className="h-4 w-4" />
        Volver al inicio
      </Link>
    );
  }

  const isDashboardRoot = pathname === dashboardPath;

  if (isDashboardRoot) {
    return (
      <Link
        href="/"
        className="inline-flex min-h-[44px] items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
      href={dashboardPath ?? "/"}
      className="inline-flex min-h-[44px] items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      aria-label="Volver al dashboard"
      data-testid="back-to-dashboard"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver al dashboard
    </Link>
  );
}
