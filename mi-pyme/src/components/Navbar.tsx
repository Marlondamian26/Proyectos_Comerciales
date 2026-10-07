"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession, signOut } from "next-auth/react";
import { Rol } from "@/lib/auth/roles";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificacionBell } from "@/components/notificaciones/NotificacionBell";
import { Avatar } from "@/components/ui/Avatar";
import { ChevronDown, LogOut, User, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const GlobalSearchBar = dynamic(
  () => import("@/components/GlobalSearchBar").then((mod) => mod.GlobalSearchBar),
  {
    ssr: false,
    loading: () => <div className="w-64 h-9" />,
  }
);

export interface NavbarProps {
  userRol?: Rol;
  esDuenoDeNegocio?: boolean;
}

export function Navbar({ userRol }: NavbarProps) {
  const showSearch = userRol === Rol.CLIENTE || userRol === Rol.ADMIN;
  const { data: session } = useSession();
  const userName = session?.user?.name ?? session?.user?.email ?? "Usuario";
  const userImage = session?.user?.image ?? null;

  return (
    <header
      className={cn(
        "sticky top-0 z-[1000] border-b bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80",
        "transition-colors duration-200"
      )}
      role="banner"
    >
      <nav className="container flex h-16 items-center justify-between gap-4" aria-label="Navegación principal">
        <div className="flex min-w-0 flex-1 items-center gap-6 overflow-x-auto">
          <Link
            href="/"
            className="flex-shrink-0 text-xl font-bold text-foreground"
            aria-label="Mi-Pyme - Inicio"
          >
            Mi-Pyme
          </Link>
          {showSearch && (
            <div className="flex-shrink-0">
              <GlobalSearchBar userRol={userRol} />
            </div>
          )}
        </div>
        <div className="flex-shrink-0 flex items-center gap-1">
          <NotificacionBell />
          <ThemeToggle />
          <UserMenu name={userName} image={userImage} />
        </div>
      </nav>
    </header>
  );
}

function UserMenu({ name, image }: { name: string; image: string | null }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menú de usuario"
      >
        <Avatar src={image} name={name} size="sm" />
        <ChevronDown className="h-4 w-4 shrink-0" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-48 z-[1100] rounded-lg border bg-popover p-1 shadow-md"
        >
          <Link
            href="/perfil"
            role="menuitem"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            onClick={() => setOpen(false)}
          >
            <User className="h-4 w-4" />
            Mi perfil
          </Link>
          <Link
            href="/admin"
            role="menuitem"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4" />
            Configuración
          </Link>
          <div role="separator" className="my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

Navbar.displayName = "Navbar";
