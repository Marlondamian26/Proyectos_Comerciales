"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Menu, X, LogIn, UserPlus } from "lucide-react";

export function HomeNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [mobileOpen]);

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 ease-out",
        scrolled
          ? "border-b border-border bg-background/95 backdrop-blur-xl shadow-sm"
          : "border-b border-border/40 bg-background/80 backdrop-blur-xl saturate-[180%]"
      )}
      aria-label="Navegación principal"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link href="/" className="flex-shrink-0 items-center" aria-label="Mi-Pyme - Ir al inicio">
          <Image
            src="/images/logos/logo-horizontal.png"
            alt="Mi-Pyme"
            width={140}
            height={40}
            sizes="(max-width: 640px) 100px, 140px"
            className="h-7 w-auto object-contain sm:h-9"
          />
        </Link>

        {/* Desktop: navegación + acciones */}
        <div className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/catalogo" className="text-muted-foreground transition-colors hover:text-foreground">Catálogo</Link>
          <Link href="/servicios" className="text-muted-foreground transition-colors hover:text-foreground">Servicios</Link>
          <Link href="/contacto" className="text-muted-foreground transition-colors hover:text-foreground">Contacto</Link>
        </div>
        <div className="hidden md:flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link href="/auth/login" className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-surface-raised text-foreground">
            Iniciar sesión
          </Link>
          <Link href="/auth/registro" className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            Registrarse
          </Link>
        </div>

        {/* Mobile: solo hamburguesa */}
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="md:hidden inline-flex items-center justify-center h-11 w-11 rounded-lg text-foreground hover:bg-surface-raised flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 top-14 sm:top-16 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="
            fixed top-14 sm:top-16 left-0 right-0 z-50
            bg-background border-b border-border shadow-lg
            md:hidden max-h-[calc(100vh-3.5rem)] overflow-y-auto
          ">
            <nav className="p-4 space-y-1">
              <Link href="/catalogo" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-raised text-base font-medium text-foreground">
                Catálogo
              </Link>
              <Link href="/servicios" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-raised text-base font-medium text-foreground">
                Servicios
              </Link>
              <Link href="/contacto" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-raised text-base font-medium text-foreground">
                Contacto
              </Link>
            </nav>

            <div className="border-t border-border p-4 space-y-2">
              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg border border-border text-base font-medium text-foreground min-h-[44px]"
              >
                <LogIn className="h-4 w-4" />
                Iniciar sesión
              </Link>
              <Link
                href="/auth/registro"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground text-base font-medium min-h-[44px] hover:bg-primary/90 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Registrarse
              </Link>
              <div className="flex items-center justify-center pt-2">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
