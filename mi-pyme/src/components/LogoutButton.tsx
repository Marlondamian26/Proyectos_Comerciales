"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // 1. Limpiar cookies del servidor (endpoint propio)
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // 2. Cerrar sesión en NextAuth (cliente)
      await signOut({ callbackUrl: "/auth/login", redirect: false });

      // 3. Navegar al login y forzar refresh de la página
      router.push("/auth/login");
      router.refresh();

      // 4. Fallback: recarga forzada si router.refresh no basta
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
      }, 100);
    } catch (error) {
      console.error("[LOGOUT] Error:", error);
      // Fallback definitivo
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }
  };

  if (!session) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2 w-full justify-start"
      onClick={handleLogout}
      disabled={loading}
      aria-label="Cerrar sesión"
    >
      <LogOut className="h-4 w-4" />
      {loading ? "Cerrando..." : "Cerrar sesión"}
    </Button>
  );
}
