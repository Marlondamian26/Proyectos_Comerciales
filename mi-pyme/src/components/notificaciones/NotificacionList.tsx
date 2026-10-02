"use client";

import { useEffect, useState, useCallback } from "react";
import { NotificacionItem } from "./NotificacionItem";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Filter,
  CheckCheck,
  RefreshCw,
  Inbox,
} from "lucide-react";
import type { Notificacion, EstadoNotificacion } from "@/generated/prisma/client";

interface ListaResponse {
  data: Notificacion[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const TODOS_ESTADOS: EstadoNotificacion[] = ["NO_LEIDA", "LEIDA", "ARCHIVADA"];

const ESTADO_LABELS: Record<EstadoNotificacion, string> = {
  NO_LEIDA: "Sin leer",
  LEIDA: "Leídas",
  ARCHIVADA: "Archivadas",
};

export function NotificacionList() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState<EstadoNotificacion | "TODOS">("TODOS");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function cargar() {
      setCargando(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (estadoFilter !== "TODOS") {
          params.set("estado", estadoFilter);
        }

        const res = await fetch(`/api/notificaciones?${params}`, {
          headers: { "Cache-Control": "no-cache" },
        });

        if (res.ok && !cancelled) {
          const data: ListaResponse = await res.json();
          setNotificaciones(data.data ?? []);
          setTotal(data.total ?? 0);
          setHasNext(data.hasNext ?? false);
          setHasPrev(data.hasPrev ?? false);
        }
      } catch {
        // Silencioso
      } finally {
        if (!cancelled) setCargando(false);
      }
    }
    void cargar();
    return () => {
      cancelled = true;
    };
  }, [page, limit, estadoFilter, reloadKey]);

  const marcarLeida = useCallback((id: string) => {
    fetch(`/api/notificaciones/${id}/leer`, { method: "PATCH" })
      .then(() => {
        setNotificaciones((prev) =>
          prev.map((n) => (n.id === id ? { ...n, estado: "LEIDA" as const, leidaEn: new Date() } : n))
        );
      })
      .catch(() => {});
  }, []);

  const archivar = useCallback((id: string) => {
    fetch(`/api/notificaciones/${id}/archivar`, { method: "PATCH" })
      .then(() => {
        setNotificaciones((prev) => prev.filter((n) => n.id !== id));
      })
      .catch(() => {});
  }, []);

  const eliminar = useCallback((id: string) => {
    fetch(`/api/notificaciones/${id}`, { method: "DELETE" })
      .then(() => {
        setNotificaciones((prev) => prev.filter((n) => n.id !== id));
      })
      .catch(() => {});
  }, []);

  const marcarTodasLeidas = useCallback(() => {
    fetch("/api/notificaciones?accion=leer-todas", { method: "POST" })
      .then(() => {
        setNotificaciones((prev) =>
          prev.map((n) => ({ ...n, estado: "LEIDA" as const, leidaEn: new Date() }))
        );
      })
      .catch(() => {});
  }, []);

  const irAPagina = (nuevaPagina: number) => {
    setPage(nuevaPagina);
  };

  const cambiarFiltro = (estado: EstadoNotificacion | "TODOS") => {
    setEstadoFilter(estado);
    setPage(1);
  };


  return (
    <div className="space-y-4" data-testid="notificacion-list">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtrar:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant={estadoFilter === "TODOS" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => cambiarFiltro("TODOS")}
            >
              Todas
            </Badge>

            {TODOS_ESTADOS.map((estado) => (
              <Badge
                key={estado}
                variant={estadoFilter === estado ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => cambiarFiltro(estado)}
              >
                {ESTADO_LABELS[estado]}
              </Badge>
            ))}
          </div>
        </div>

        {estadoFilter === "NO_LEIDA" && notificaciones.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            icon={<CheckCheck className="h-4 w-4" />}
            iconPosition="left"
            onClick={marcarTodasLeidas}
            aria-label="Marcar todas como leídas"
          >
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {cargando ? (
        <div className="space-y-2" aria-label="Cargando notificaciones">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-muted/50"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : notificaciones.length === 0 ? (
        <div className="py-10 text-center">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            {estadoFilter === "TODOS"
              ? "No tienes notificaciones."
              : `No hay notificaciones ${ESTADO_LABELS[estadoFilter?.toLowerCase() as EstadoNotificacion]?.toLowerCase() ?? ""}.`}
          </p>
          {estadoFilter !== "TODOS" && (
            <Button
              variant="link"
              size="sm"
              onClick={() => cambiarFiltro("TODOS")}
              className="mt-2"
            >
              Ver todas
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-1" role="list">
          {notificaciones.map((n) => (
            <div key={n.id} className="group">
              <NotificacionItem
                notificacion={n}
                onMarcarLeida={marcarLeida}
                onArchivar={archivar}
                onEliminar={eliminar}
              />
            </div>
          ))}
        </div>
      )}

      {total > 0 && !cargando && (
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {total} notificacion(es) · Página {page}
          </p>

          <div className="flex items-center gap-2">
            {hasPrev && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => irAPagina(page - 1)}
                aria-label="Página anterior"
              >
                Anterior
              </Button>
            )}

            {hasNext && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => irAPagina(page + 1)}
                aria-label="Página siguiente"
              >
                Siguiente
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw className="h-3 w-3" />}
              aria-label="Recargar"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              <span className="sr-only">Recargar</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

NotificacionList.displayName = "NotificacionList";
