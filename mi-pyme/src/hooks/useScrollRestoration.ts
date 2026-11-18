"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { isExceptionRoute } from "@/lib/scroll-exceptions";

const STORAGE_PREFIX = "mp:scroll:";
const SCROLL_TO_TOP_FLAG = "mp:scroll-to-top";

/**
 * Guarda la posición del scroll de la ruta actual en sessionStorage.
 */
export function saveScrollPosition(pathname: string, search: string) {
  if (typeof window === "undefined") return;
  const key = `${STORAGE_PREFIX}${pathname}?${search}`;
  try {
    sessionStorage.setItem(key, String(window.scrollY));
  } catch {
    // sessionStorage lleno o no disponible
  }
}

/**
 * Obtiene la posición guardada de una ruta.
 */
export function getSavedScrollPosition(
  pathname: string,
  search: string
): number | null {
  if (typeof window === "undefined") return null;
  const key = `${STORAGE_PREFIX}${pathname}?${search}`;
  const value = sessionStorage.getItem(key);
  if (value === null) return null;
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
}

/**
 * Marca la siguiente navegación como "ir al top" (excepción).
 * Útil para logout, login, checkout, acciones destructivas, formularios.
 * Llamar ANTES de router.push / router.replace / window.location.href.
 */
export function markNextNavigationAsTop() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SCROLL_TO_TOP_FLAG, "true");
  } catch {}
}

/**
 * Borra el flag de "ir al top" si existe.
 */
export function clearScrollToTopFlag() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SCROLL_TO_TOP_FLAG);
  } catch {}
}

/**
 * Hook principal de restauración del scroll.
 * - Guarda la posición al salir de cada ruta (cleanup del effect).
 * - Detecta popstate (back/forward del navegador).
 * - Restaura posición en back/forward salvo excepciones.
 * - Va al top en forward navigation y rutas de excepción.
 */
export function useScrollRestoration() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() || "";
  const previousPathname = useRef<string | null>(null);
  const previousSearch = useRef<string | null>(null);
  const isPopstate = useRef(false);

  // Detectar back/forward del navegador
  useEffect(() => {
    const handlePopstate = () => {
      isPopstate.current = true;
    };
    window.addEventListener("popstate", handlePopstate);
    return () => window.removeEventListener("popstate", handlePopstate);
  }, []);

  // Guardar la posición al salir de la ruta actual (antes de navegar a otra)
  useEffect(() => {
    return () => {
      saveScrollPosition(pathname, search);
    };
  }, [pathname, search]);

  // Manejar scroll al cambiar de ruta
  useEffect(() => {
    // Primera renderización: sólo registrar y salir
    if (previousPathname.current === null) {
      previousPathname.current = pathname;
      previousSearch.current = search;
      if (sessionStorage.getItem(SCROLL_TO_TOP_FLAG) === "true") {
        sessionStorage.removeItem(SCROLL_TO_TOP_FLAG);
        window.scrollTo(0, 0);
      }
      return;
    }

    const isSamePath = previousPathname.current === pathname;
    const hasTopFlag = sessionStorage.getItem(SCROLL_TO_TOP_FLAG) === "true";
    if (hasTopFlag) {
      sessionStorage.removeItem(SCROLL_TO_TOP_FLAG);
    }

    const currentIsException = isExceptionRoute(pathname);

    // Misma ruta, distinto query params (búsqueda/filtros): mantener posición
    if (isSamePath && previousSearch.current !== search) {
      previousPathname.current = pathname;
      previousSearch.current = search;
      return;
    }

    // Excepción o flag de "ir al top"
    if (hasTopFlag || currentIsException) {
      window.scrollTo(0, 0);
      previousPathname.current = pathname;
      previousSearch.current = search;
      isPopstate.current = false;
      return;
    }

    // Back/forward del navegador: restaurar posición guardada
    if (isPopstate.current) {
      const savedPosition = getSavedScrollPosition(pathname, search);
      if (savedPosition !== null) {
        requestAnimationFrame(() => {
          window.scrollTo(0, savedPosition);
        });
      } else {
        window.scrollTo(0, 0);
      }
      previousPathname.current = pathname;
      previousSearch.current = search;
      isPopstate.current = false;
      return;
    }

    // Navegación forward a nueva ruta: ir al top
    if (previousPathname.current !== pathname) {
      window.scrollTo(0, 0);
      previousPathname.current = pathname;
      previousSearch.current = search;
    }
  }, [pathname, search]);

  return {
    saveScrollPosition: useCallback(
      () => saveScrollPosition(pathname, search),
      [pathname, search]
    ),
    markNextNavigationAsTop,
  };
}
