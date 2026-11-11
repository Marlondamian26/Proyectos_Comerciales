"use client";

import { useEffect, useRef } from "react";
import { NotificacionItem } from "./NotificacionItem";
import { Button } from "@/components/ui/Button";
import { ChevronRight } from "lucide-react";
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 z-50 w-80 max-w-sm rounded-md border bg-popover text-popover-foreground shadow-lg"
      role="menu"
      aria-orientation="vertical"
      aria-label="Notificaciones recientes"
    >
      <div className="flex items-center justify-between p-3 border-b">
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
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notificaciones.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground text-center">
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

      <div className="p-2 border-t">
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
}

NotificacionDropdown.displayName = "NotificacionDropdown";
