"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { isDashboardNavigationRoute } from "@/lib/navigation/dashboard-routes";

type Profile = {
  nombre?: string;
  email?: string;
  rol?: string;
  provincia?: string;
  municipio?: string;
};

const ROLE_DASHBOARD: Record<string, string> = {
  CLIENTE: "/cliente",
  NEGOCIO: "/negocio",
  LOGISTICA: "/logistica",
  ADMIN: "/admin",
};

export function DashboardBackLink() {
  const [rol, setRol] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const isInDashboard = isDashboardNavigationRoute(pathname);

  useEffect(() => {
    if (isInDashboard) return;
    let cancelled = false;

    async function loadProfile() {
      try {
        const res = await fetch("/api/perfil");
        if (!res.ok) return;
        const data = (await res.json()) as Profile;
        if (!cancelled) {
          setRol(data.rol ?? null);
        }
      } catch {
        // noop
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [isInDashboard]);

  if (isInDashboard) {
    return null;
  }

  if (loading) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        Cargando...
      </span>
    );
  }

  const href = rol ? ROLE_DASHBOARD[rol] ?? "/" : "/";

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
      aria-label="Volver al dashboard"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver al dashboard
    </Link>
  );
}
