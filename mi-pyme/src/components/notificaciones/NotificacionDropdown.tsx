"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { NotificacionItem } from "./NotificacionItem";
import { Button } from "@/components/ui/Button";
import { ChevronRight, X } from "lucide-react";
import Link from "next/link";
import type { Notificacion } from "@/generated/prisma/client";

interface NotificacionDropdownProps {
  open: boolean;
  notificaciones: Notificacion[];
  noLeidas: number;
  onMarcarLeida: (id: string) => void;
  onArchivar: (id: string) => void;
  onEliminar: (id: string) => void;
  onMarcarTodasLeidas: () => void;
  onClose: () => void;
}

export function NotificacionDropdown({
  open,
  notificaciones,
  noLeidas,
  onMarcarLeida,
  onArchivar,
  onEliminar,
  onMarcarTodasLeidas,
  onClose,
}: NotificacionDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  const panel = (
    <div
      ref={dropdownRef}
      data-notification-panel
      role="dialog"
      aria-modal="true"
      aria-label="Notificaciones recientes"
      className="
        fixed z-[70]
        top-auto
        w-[calc(100vw-2rem)]
        max-w-sm
        sm:max-w-md
        max-h-[calc(100vh-5rem)]
        overflow-y-auto
        bg-popover
        border
        border-border
        rounded-lg
        shadow-xl
        sm:absolute
        sm:right-0
        sm:top-full
        sm:mt-2
        sm:inset-x-auto
      "
      style={{
        position: "fixed",
        top: "auto",
        ...(mounted ? {} : {}),
      }}
    >
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-popover z-10">
        <h3 className="font-semibold text-sm">Notificaciones</h3>
        {noLeidas > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarcarTodasLeidas}
            aria-label={`Marcar las ${noLeidas} notificaciones como leídas`}
          >
            Marcas todas
          </Button>
        )}
        <button
          onClick={onClose}
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-muted hover:text-foreground"
          aria-label="Cerrar notificaciones"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4">
        {notificaciones.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center">
            No tienes notificaciones.
          </p>
        ) : (
          notificaciones.map((n) => (
            <div key={n.id} className="group">
              <NotificacionItem
                notificacion={n}
                compact
                onMarcarLeida={onMarcarLeida}
                onArchivar={onArchivar}
                onEliminar={onEliminar}
              />
            </div>
          ))
        )}
      </div>

      <div className="p-2 border-t border-border">
        <Link
          href="/notificaciones"
          onClick={onClose}
          className="flex items-center justify-center gap-1 text-sm text-center hover:text-primary"
        >
          Ver todas las notificaciones
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );

  return mounted ? createPortal(panel, document.body) : null;
}
