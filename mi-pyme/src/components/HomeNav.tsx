"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";

export function HomeNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "sticky top-0 z-[1000] w-full transition-all duration-300 ease-out",
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
            priority
            className="h-7 w-auto object-contain sm:h-9"
          />
        </Link>
        <div className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/catalogo" className="text-muted-foreground transition-colors hover:text-foreground">Catálogo</Link>
          <Link href="/servicios" className="text-muted-foreground transition-colors hover:text-foreground">Servicios</Link>
          <Link href="/contacto" className="text-muted-foreground transition-colors hover:text-foreground">Contacto</Link>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link href="/auth/login" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm">Iniciar sesión</Button>
          </Link>
          <Link href="/auth/registro">
            <Button size="sm">Registrarse</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
