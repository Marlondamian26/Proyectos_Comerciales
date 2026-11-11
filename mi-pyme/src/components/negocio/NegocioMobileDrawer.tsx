"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NegocioSidebar } from "./NegocioSidebar";

export interface NegocioMobileDrawerProps {
  userRol?: string;
}

export function NegocioMobileDrawer({ userRol }: NegocioMobileDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="md:hidden flex h-11 w-11 items-center justify-center rounded-lg text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={open ? "Cerrar menú de negocio" : "Abrir menú de negocio"}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      <NegocioSidebar
        userRol={userRol}
        mobileOpen={open}
        onMobileOpenChange={setOpen}
      />
    </>
  );
}
