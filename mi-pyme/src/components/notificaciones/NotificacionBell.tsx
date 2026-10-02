"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NotificacionDropdown } from "./NotificacionDropdown";
import { useToast } from "@/components/ui/Toast";
import type { Notificacion } from "@/generated/prisma/client";

interface ConteoResponse {
  count: number;
}

interface ListaResponse {
  data: Notificacion[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function NotificacionBell() {
  const [abierto, setAbierto] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const [recientes, setRecientes] = useState<Notificacion[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    const controller = new AbortController();
    async function cargar() {
      try {
        const res = await fetch("/api/notificaciones/no-leidas", {
          signal: controller.signal,
          headers: { "Cache-Control": "no-cache" },
        });
        if (res.ok && !controller.signal.aborted) {
          const data: ConteoResponse = await res.json();
          setNoLeidas(data.count);
        }
      } catch {
        // Silencioso
      }
    }
    void cargar();

    const intervalo = setInterval(() => {
      void cargar();
    }, 60000);

    return () => {
      controller.abort();
      clearInterval(intervalo);
    };
  }, []);

  useEffect(() => {
    if (!abierto) return;

     const controller = new AbortController();
    async function cargar() {
      try {
        const res = await fetch("/api/notificaciones?limit=5", {
          signal: controller.signal,
          headers: { "Cache-Control": "no-cache" },
        });
        if (res.ok && !controller.signal.aborted) {
          const data: ListaResponse = await res.json();
          setRecientes(data.data ?? []);
        }
      } catch {
        // Silencioso
      }
    }
    void cargar();

    return () => controller.abort();
  }, [abierto]);

  const marcarLeida = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notificaciones/${id}/leer`, { method: "PATCH" });
      setRecientes((prev) => prev.filter((n) => n.id !== id));
      setNoLeidas((prev) => Math.max(0, prev - 1));
    } catch {
      addToast({ message: "No se pudo marcar como leída", variant: "error" });
    }
  }, [addToast]);

  const archivar = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notificaciones/${id}/archivar`, { method: "PATCH" });
      setRecientes((prev) => prev.filter((n) => n.id !== id));
      if (noLeidas > 0) setNoLeidas((prev) => Math.max(0, prev - 1));
    } catch {
      addToast({ message: "No se pudo archivar la notificación", variant: "error" });
    }
  }, [noLeidas, addToast]);

  const eliminar = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notificaciones/${id}`, { method: "DELETE" });
      setRecientes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      addToast({ message: "No se pudo eliminar la notificación", variant: "error" });
    }
  }, [addToast]);

  const marcarTodasLeidas = useCallback(async () => {
    try {
      const res = await fetch("/api/notificaciones?accion=leer-todas", {
        method: "POST",
      });
      if (res.ok) {
        setRecientes((prev) =>
          prev.map((n) => ({ ...n, estado: "LEIDA" as const, leidaEn: new Date() }))
        );
        setNoLeidas(0);
        addToast({ message: "Todas las notificaciones marcadas como leídas", variant: "success" });
      }
    } catch {
      addToast({ message: "No se pudieron marcar todas como leídas", variant: "error" });
    }
  }, [addToast]);

  return (
    <div className="relative flex-shrink-0">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Notificaciones (${noLeidas} sin leer)`}
        aria-expanded={abierto}
        aria-haspopup="menu"
        aria-controls={abierto ? "notificacion-dropdown" : undefined}
        className="relative"
        onClick={() => setAbierto(!abierto)}
        type="button"
      >
        <Bell className="h-5 w-5" />
        {noLeidas > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground"
            aria-live="polite"
            aria-label={`${noLeidas} notificaciones sin leer`}
          >
            {noLeidas > 99 ? "99+" : noLeidas}
          </span>
        )}
      </Button>

      {abierto && (
        <NotificacionDropdown
          open={abierto}
          notificaciones={recientes}
          noLeidas={noLeidas}
          onMarcarLeida={marcarLeida}
          onArchivar={archivar}
          onEliminar={eliminar}
          onMarcarTodasLeidas={marcarTodasLeidas}
          onClose={() => setAbierto(false)}
        />
      )}
    </div>
  );
}

NotificacionBell.displayName = "NotificacionBell";
