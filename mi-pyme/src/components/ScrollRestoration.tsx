"use client";

import { useEffect } from "react";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";

/**
 * Configura scrollRestoration = 'manual' al montar para que la app
 * controle el scroll al navegar en lugar del navegador ('auto').
 */
export function ScrollRestorationSetup() {
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);
  return null;
}

/**
 * Componente que maneja el comportamiento del scroll al navegar entre vistas.
 *
 * Reglas:
 * - Navegación forward (Link, router.push): scroll al top.
 * - Navegación back/forward del navegador: restaurar posición previa.
 * - Misma ruta, distinto query params (búsqueda/filtros): mantener posición.
 * - Rutas de excepción (auth, pago, logout, formularios): siempre top.
 * - Recarga (F5): scroll al top (comportamiento default del navegador).
 *
 * Usa sessionStorage para guardar la posición por ruta y popstate para
 * detectar back/forward.
 */
export function ScrollRestoration() {
  useScrollRestoration();
  return null;
}
