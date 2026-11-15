"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Hook que cierra un dropdown/modal cuando cambia la ruta.
 * Uso: useCloseOnRouteChange(() => setOpen(false));
 */
export function useCloseOnRouteChange(onClose: () => void) {
  const pathname = usePathname();
  const onCloseRef = useRef(onClose);

  // Mantener el ref actualizado sin re-registrar el effect
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    onCloseRef.current();
  }, [pathname]);
}
