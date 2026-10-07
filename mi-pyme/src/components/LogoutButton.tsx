"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2 w-full justify-start"
      onClick={handleLogout}
      aria-label="Cerrar sesión"
    >
      <LogOut className="h-4 w-4" />
      Cerrar sesión
    </Button>
  );
}
