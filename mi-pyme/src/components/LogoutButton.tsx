"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      await signOut({
        callbackUrl: "/auth/login",
        redirect: false,
      });

      if (typeof window !== "undefined") {
        const theme = localStorage.getItem("theme");
        localStorage.clear();
        sessionStorage.clear();
        if (theme) localStorage.setItem("theme", theme);
      }

      window.location.href = "/auth/login";
    } catch (error) {
      console.error("[LOGOUT] Error:", error);
      window.location.href = "/auth/login";
    }
  };

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
