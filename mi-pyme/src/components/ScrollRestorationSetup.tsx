"use client";

import { useEffect } from "react";

/**
 * Fuerza scrollRestoration = 'manual' para que la app controle el scroll
 * al navegar (back/forward) en lugar de dejarlo al comportamiento 'auto'
 * del navegador, que es inconsistente.
 */
export function ScrollRestorationSetup() {
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);
  return null;
}
