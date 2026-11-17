"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Cierra un dropdown/modal cuando cambia la ruta o los query params.
 * Detecta:
 * - Navegación con <Link> o router.push (cambio de pathname)
 * - Cambio de query params (cambio de searchParams)
 * - Navegación back/forward del navegador (popstate)
 * - Redirects después de signOut
 *
 * Uso:
 *   const [open, setOpen] = useState(false);
 *   const handleClose = useCallback(() => setOpen(false), []);
 *   useCloseOnRouteChange(handleClose);
 */
export function useCloseOnRouteChange(onClose: () => void) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onCloseRef = useRef(onClose);
  const prevPathnameRef = useRef<string | null>(null);
  const prevSearchRef = useRef<string | null>(null);

  // Mantener el ref actualizado sin re-registrar el effect
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Detectar cambio de pathname o searchParams
  useEffect(() => {
    const currentSearch = searchParams?.toString() || "";

    // Primera renderización: solo guardar valores
    if (prevPathnameRef.current === null) {
      prevPathnameRef.current = pathname;
      prevSearchRef.current = currentSearch;
      return;
    }

    // Si cambió el pathname o los searchParams → cerrar
    if (
      prevPathnameRef.current !== pathname ||
      prevSearchRef.current !== currentSearch
    ) {
      prevPathnameRef.current = pathname;
      prevSearchRef.current = currentSearch;
      onCloseRef.current();
    }
  }, [pathname, searchParams]);

  // Listener de popstate (back/forward del navegador)
  useEffect(() => {
    const handlePopstate = () => {
      onCloseRef.current();
    };
    window.addEventListener("popstate", handlePopstate);
    return () => window.removeEventListener("popstate", handlePopstate);
  }, []);

  useEffect(() => {
    const handleHashchange = () => onCloseRef.current();
    window.addEventListener("hashchange", handleHashchange);
    return () => window.removeEventListener("hashchange", handleHashchange);
  }, []);

  useEffect(() => {
    const handleCustomClose = () => onCloseRef.current();
    window.addEventListener("mp:close-dropdowns", handleCustomClose);
    return () => window.removeEventListener("mp:close-dropdowns", handleCustomClose);
  }, []);
}

export function closeAllDropdowns() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mp:close-dropdowns"));
  }
}
