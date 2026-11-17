"use client";

import { useState, useCallback } from "react";
import { useCloseOnRouteChange } from "@/hooks/useCloseOnRouteChange";
import { Menu, X } from "lucide-react";
import { NegocioSidebar } from "./NegocioSidebar";

export function NegocioMobileDrawer() {
  const [open, setOpen] = useState(false);
  const handleClose = useCallback(() => setOpen(false), []);
  useCloseOnRouteChange(handleClose);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed left-4 top-[4.5rem] z-[60] flex h-11 w-11 items-center justify-center rounded-lg bg-background/80 text-foreground shadow-sm backdrop-blur-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        aria-label={open ? "Cerrar menú de negocio" : "Abrir menú de negocio"}
        aria-expanded={open}
        aria-controls="negocio-sidebar-mobile"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      <NegocioSidebar
        mobileOpen={open}
        onMobileOpenChange={setOpen}
      />
    </>
  );
}
