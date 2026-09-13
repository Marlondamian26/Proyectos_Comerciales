"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Rol } from "@/lib/auth/roles";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlobalSearchBar } from "@/components/GlobalSearchBar";
import { Search } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  allowedRoles?: Rol[];
}

const navItems: NavItem[] = [
  { label: "Inicio", href: "/", icon: "🏠", allowedRoles: [] },
  { label: "Catálogo", href: "/catalogo", icon: "🛍️", allowedRoles: [] },
  { label: "Carrito", href: "/carrito", icon: "🛒", allowedRoles: [Rol.CLIENTE] },
  { label: "Reservas", href: "/reservas", icon: "📅", allowedRoles: [Rol.CLIENTE] },
  {
    label: "Pedidos",
    href: "/pedidos",
    icon: "📦",
    allowedRoles: [Rol.CLIENTE, Rol.NEGOCIO, Rol.LOGISTICA],
  },
  {
    label: "Facturas",
    href: "/facturas",
    icon: "🧾",
    allowedRoles: [Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN],
  },
  {
    label: "Cliente",
    href: "/cliente",
    icon: "👤",
    allowedRoles: [Rol.CLIENTE],
  },
  {
    label: "Negocio",
    href: "/negocio",
    icon: "🏢",
    allowedRoles: [Rol.NEGOCIO, Rol.ADMIN],
  },
  {
    label: "Logística",
    href: "/logistica",
    icon: "🚚",
    allowedRoles: [Rol.LOGISTICA, Rol.ADMIN],
  },
  {
    label: "Admin",
    href: "/admin",
    icon: "⚙️",
    allowedRoles: [Rol.ADMIN],
  },
];

export interface NavbarProps {
  userRol?: Rol;
}

export function Navbar({ userRol }: NavbarProps) {
  const pathname = usePathname();
  const showSearch = userRol === Rol.CLIENTE || userRol === Rol.ADMIN;

  return (
    <header
      className={cn(
        "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
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
          <ul className="flex items-center gap-2" role="menubar">
            {navItems
              .filter(
                (item) =>
                  !item.allowedRoles ||
                  item.allowedRoles.length === 0 ||
                  (userRol && item.allowedRoles.includes(userRol))
              )
              .map((item) => (
                <li key={item.href} role="none">
                  <Link
                    href={item.href}
                    role="menuitem"
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                      "hover:bg-muted hover:text-foreground",
                      pathname === item.href
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground"
                    )}
                    aria-current={pathname === item.href ? "page" : undefined}
                  >
                    <span className="mr-2" aria-hidden="true">
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              ))}
          </ul>
          {showSearch && (
            <div className="flex-shrink-0">
              <GlobalSearchBar userRol={userRol} />
            </div>
          )}
          {!showSearch && userRol && (
            <SearchDropdown userRol={userRol} />
          )}
        </div>
        <div className="flex-shrink-0">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}

function SearchDropdown({ userRol }: { userRol: Rol }) {
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
    <div className="relative flex-shrink-0" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Búsqueda"
        aria-expanded={open}
        type="button"
      >
        <Search className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 z-50">
          <GlobalSearchBar userRol={userRol} compact />
        </div>
      )}
    </div>
  );
}

Navbar.displayName = "Navbar";