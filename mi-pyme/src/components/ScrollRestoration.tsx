"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Componente que maneja el comportamiento del scroll al navegar entre vistas.
 *
 * Reglas:
 * - Navegación forward (Link, router.push): scroll al top.
 * - Navegación back/forward del navegador: restaurar posición previa (no tocar).
 * - Cambios en query params (ej. búsqueda): NO resetear scroll.
 * - Recarga (F5): scroll al top (comportamiento default del navegador).
 *
 * Usa `window.scrollTo({ top: 0, behavior: "instant" })` para evitar animaciones
 * que interfieran con back/forward.
 */
export function ScrollRestoration() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathname = useRef<string | null>(null);
  const isPopstate = useRef(false);

  // Detectar back/forward del navegador con popstate
  useEffect(() => {
    const handlePopstate = () => {
      isPopstate.current = true;
    };

    window.addEventListener("popstate", handlePopstate);
    return () => window.removeEventListener("popstate", handlePopstate);
  }, []);

  // Manejar scroll al cambiar de ruta
  useEffect(() => {
    const isNewPath = previousPathname.current !== pathname;
    const isSamePath = previousPathname.current === pathname;

    // Si es back/forward del navegador, NO resetear (el navegador restaura)
    if (isPopstate.current) {
      isPopstate.current = false;
      previousPathname.current = pathname;
      return;
    }

    // Si es la misma ruta pero cambian query params, NO resetear scroll
    if (isSamePath) {
      return;
    }

    // Navegación forward a nueva ruta: scroll al top de forma instantánea
    if (isNewPath) {
      window.scrollTo({ top: 0, behavior: "instant" });
      previousPathname.current = pathname;
    }
  }, [pathname, searchParams]);

  return null;
}
