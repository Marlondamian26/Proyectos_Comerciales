"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  variant?: "mobile" | "desktop";
}

export function LogoutButton({ variant = "desktop" }: LogoutButtonProps) {
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
      size={variant === "mobile" ? "sm" : "sm"}
className={cn(
  "gap-2",
  variant === "mobile"
    ? "w-full justify-start"
    : "justify-between px-4 bg-primary text-primary-foreground hover:bg-primary/90",
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none"
)}
      onClick={handleLogout}
      disabled={loading}
      aria-label="Cerrar sesión"
    >
      <LogOut className="h-4 w-4" />
      {loading ? "Cerrando..." : "Cerrar sesión"}
    </Button>
  );
}
