"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { Rol } from "@/lib/auth/roles";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificacionBell } from "@/components/notificaciones/NotificacionBell";
import { Avatar } from "@/components/ui/Avatar";
import { ChevronDown, User, Settings, Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { LogoutButton } from "@/components/LogoutButton";

const GlobalSearchBar = dynamic(
  () => import("@/components/GlobalSearchBar").then((mod) => mod.GlobalSearchBar),
  {
    ssr: false,
    loading: () => <div className="h-9 w-52 animate-pulse rounded-md bg-muted/40" />,
  }
);

export interface NavbarProps {
  userRol?: Rol;
  esDuenoDeNegocio?: boolean;
}

export function Navbar({ userRol }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const showSearch = userRol === Rol.CLIENTE || userRol === Rol.ADMIN;
  const { data: session } = useSession();
  const userName = session?.user?.name ?? session?.user?.email ?? "Usuario";
  const userImage =
    session?.user?.fotoPerfilUrl ?? session?.user?.image ?? null;

  return (
    <header
      className={cn(
        "sticky top-0 z-[1000] border-b border-border bg-background",
        "transition-colors duration-200"
      )}
      role="banner"
    >
      <nav
        className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:h-16 sm:gap-4 sm:px-6 lg:px-8"
        aria-label="Navegación principal"
      >
        <Link
          href="/"
          className="flex-shrink-0 items-center"
          aria-label="Mi-Pyme - Ir al inicio"
        >
          <Image
            src="/images/logos/logo-horizontal.png"
            alt="Mi-Pyme"
            width={140}
            height={40}
            sizes="(max-width: 640px) 100px, 140px"
            priority
            className="h-7 w-auto object-contain sm:h-9"
          />
        </Link>

        {showSearch && (
          <div className="hidden flex-1 justify-center md:flex">
            <div className="w-full max-w-md">
              <GlobalSearchBar userRol={userRol} />
            </div>
          </div>
        )}

        <div className="hidden items-center gap-2 md:flex">
          <NotificacionBell />
          <ThemeToggle />
          <UserMenu name={userName} image={userImage} />
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto max-w-7xl space-y-4 px-4 py-4">
            {showSearch && (
              <div className="w-full">
                <GlobalSearchBar userRol={userRol} />
              </div>
            )}
            <nav className="flex flex-col gap-1">
              <Link href="/catalogo" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                Catálogo
              </Link>
              <Link href="/servicios" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                Servicios
              </Link>
              <Link href="/perfil" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                Mi perfil
              </Link>
            </nav>
            <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <NotificacionBell />
              </div>
              <UserMenu name={userName} image={userImage} />
            </div>
          </div>
        </div>
      )}
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
          <LogoutButton />
        </div>
      )}
    </div>
  );
}

Navbar.displayName = "Navbar";
