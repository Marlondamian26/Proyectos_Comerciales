"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";

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

  useEffect(() => {
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
  }, []);

  if (loading) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Home className="h-4 w-4" />
        Cargando...
      </span>
    );
  }

  const href = rol ? ROLE_DASHBOARD[rol] ?? "/" : "/";

  return (
    <Link href={href} className="inline-flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground hover:text-foreground transition-colors">
      <Home className="h-4 w-4" />
      Volver a inicio
    </Link>
  );
}
