"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { NotificacionBadge } from "./NotificacionBadge";
import { Button } from "@/components/ui/Button";
import {
  Check,
  Archive,
  Trash2,
} from "lucide-react";
import type { Notificacion } from "@/generated/prisma/client";

interface NotificacionItemProps {
  notificacion: Notificacion;
  compact?: boolean;
  onMarcarLeida?: (id: string) => void;
  onArchivar?: (id: string) => void;
  onEliminar?: (id: string) => void;
}

function formatearFechaRelativa(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  const ahora = new Date();
  const diffMs = ahora.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "hace un momento";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `hace ${diffD} d`;
  return d.toLocaleDateString();
}

export function NotificacionItem({
  notificacion,
  compact = false,
  onMarcarLeida,
  onArchivar,
  onEliminar,
}: NotificacionItemProps) {
  const esNueva = notificacion.estado === "NO_LEIDA";
  const baseClases = "flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors";

  return (
    <div
      className={cn(baseClases, esNueva && "bg-primary/5", compact && "py-2 px-2 text-sm")}
      data-testid={`notificacion-item-${notificacion.id}`}
    >
      <NotificacionBadge tipo={notificacion.tipo} size="sm" />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p
              className={cn(
                "font-medium text-sm",
                esNueva ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {notificacion.titulo}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
              {notificacion.mensaje}
            </p>
          </div>

          {!compact && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {esNueva && onMarcarLeida && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Check className="h-3 w-3" />}
                  onClick={() => onMarcarLeida(notificacion.id)}
                  aria-label={`Marcar como leída: ${notificacion.titulo}`}
                >
                  <span className="sr-only">Marcar como leída</span>
                </Button>
              )}
              {onArchivar && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Archive className="h-3 w-3" />}
                  onClick={() => onArchivar(notificacion.id)}
                  aria-label={`Archivar: ${notificacion.titulo}`}
                >
                  <span className="sr-only">Archivar</span>
                </Button>
              )}
              {onEliminar && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 className="h-3 w-3" />}
                  onClick={() => onEliminar(notificacion.id)}
                  aria-label={`Eliminar: ${notificacion.titulo}`}
                >
                  <span className="sr-only">Eliminar</span>
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatearFechaRelativa(notificacion.createdAt)}
          </span>

          {notificacion.enlace && (
            <Link
              href={notificacion.enlace}
              className="text-xs text-primary hover:underline"
              onClick={esNueva && onMarcarLeida ? () => onMarcarLeida(notificacion.id) : undefined}
            >
              Ver detalle
            </Link>
          )}

          {esNueva && (
            <span
              className="w-2 h-2 rounded-full bg-primary"
              aria-label="No leída"
            />
          )}
        </div>
      </div>
    </div>
  );
}

NotificacionItem.displayName = "NotificacionItem";
