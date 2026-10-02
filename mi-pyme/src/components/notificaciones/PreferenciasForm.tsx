"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { useToast } from "@/components/ui/Toast";
import { CATEGORIA_NOTIFICACION, ETIQUETA_CATEGORIA } from "@/shared/notificaciones.types";
import type { TipoNotificacion } from "@/generated/prisma/client";
import { NotificacionBadge } from "./NotificacionBadge";
import { Loader2, Save } from "lucide-react";

interface PreferenciasResponse {
  [tipo: string]: {
    inApp: boolean;
    email: boolean;
  };
}

const TIPOS_TODOS: TipoNotificacion[] = Object.keys(CATEGORIA_NOTIFICACION) as TipoNotificacion[];

export function PreferenciasForm() {
  const [preferencias, setPreferencias] = useState<Record<string, { inApp: boolean; email: boolean }>>({});
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    async function cargar() {
      setCargando(true);
      try {
        const res = await fetch("/api/notificaciones/preferencias", {
          headers: { "Cache-Control": "no-cache" },
        });
        if (res.ok && !cancelled) {
          const data: PreferenciasResponse = await res.json();
          if (!cancelled) setPreferencias(data ?? {});
        }
      } catch {
        if (!cancelled) {
          addToast({ message: "No se pudieron cargar las preferencias", variant: "error" });
        }
      } finally {
        if (!cancelled) setCargando(false);
      }
    }
    void cargar();
    return () => {
      cancelled = true;
    };
  }, [addToast]);

  const togglePreferencia = (tipo: TipoNotificacion, canal: "inApp" | "email") => {
    setPreferencias((prev) => {
      const actual = prev[tipo] ?? { inApp: true, email: true };
      return {
        ...prev,
        [tipo]: {
          ...actual,
          [canal]: !actual[canal],
        },
      };
    });
  };

  const guardar = useCallback(async () => {
    if (!TIPOS_TODOS.length) return;

    setGuardando(true);
    try {
      const body = TIPOS_TODOS.map((tipo) => ({
        tipo,
        inApp: preferencias[tipo]?.inApp ?? true,
        email: preferencias[tipo]?.email ?? false,
      }));

      const res = await fetch("/api/notificaciones/preferencias", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        addToast({ message: "Preferencias guardadas correctamente", variant: "success" });
      } else {
        const error = await res.json();
        addToast({
          message: error?.error ?? "Error al guardar preferencias",
          variant: "error",
        });
      }
    } catch {
      addToast({ message: "Error al guardar preferencias", variant: "error" });
    } finally {
      setGuardando(false);
    }
  }, [preferencias, addToast]);

  const toggleTodoCategoria = useCallback((
    categoria: string,
    canal: "inApp" | "email",
    activar: boolean
  ) => {
    const tiposCategoria = TIPOS_TODOS.filter((t) => CATEGORIA_NOTIFICACION[t] === categoria);
    setPreferencias((prev) => {
      const next = { ...prev };
      for (const tipo of tiposCategoria) {
        const actual = next[tipo] ?? { inApp: true, email: true };
        next[tipo] = { ...actual, [canal]: activar };
      }
      return next;
    });
  }, []);

  const getCategoriaEstado = (categoria: string, canal: "inApp" | "email") => {
    const tiposCategoria = TIPOS_TODOS.filter((t) => CATEGORIA_NOTIFICACION[t] === categoria);
    const activos = tiposCategoria.filter(
      (t) => preferencias[t]?.[canal] ?? (canal === "inApp")
    );
    if (activos.length === tiposCategoria.length) return "all";
    if (activos.length === 0) return "none";
    return "partial";
  };

  const CATEGORIAS: Record<string, string> = ETIQUETA_CATEGORIA;

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-8" aria-label="Cargando preferencias">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="preferencias-form">
      {Object.entries(CATEGORIAS).map(([cat, label]) => {
        const tiposCategoria = TIPOS_TODOS.filter((t) => CATEGORIA_NOTIFICACION[t] === cat);
        const inAppEstado = getCategoriaEstado(cat, "inApp");
        const emailEstado = getCategoriaEstado(cat, "email");

        return (
          <div key={cat} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-semibold">{label}</h3>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => {
                    const nuevo = inAppEstado === "all";
                    toggleTodoCategoria(cat, "inApp", !nuevo);
                  }}
                  className="hover:text-foreground underline"
                >
                  {inAppEstado === "all" ? "Desactivar in-app" : "Activar in-app"}
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => {
                    const nuevo = emailEstado === "all";
                    toggleTodoCategoria(cat, "email", !nuevo);
                  }}
                  className="hover:text-foreground underline"
                >
                  {emailEstado === "all" ? "Desactivar email" : "Activar email"}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {tiposCategoria.map((tipo) => {
                const pref = preferencias[tipo] ?? { inApp: true, email: false };
                return (
                  <div key={tipo} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <NotificacionBadge tipo={tipo} size="sm" />
                      <span className="text-sm">{tipo.replace(/_/g, " ")}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Checkbox
                          id={`inapp-${tipo}`}
                          checked={pref.inApp}
                          onChange={() => togglePreferencia(tipo, "inApp")}
                          aria-label={`Notificación in-app para ${tipo}`}
                        />
                        <label
                          htmlFor={`inapp-${tipo}`}
                          className="text-xs text-muted-foreground"
                        >
                          In-app
                        </label>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Checkbox
                          id={`email-${tipo}`}
                          checked={pref.email}
                          onChange={() => togglePreferencia(tipo, "email")}
                          aria-label={`Email para ${tipo}`}
                        />
                        <label
                          htmlFor={`email-${tipo}`}
                          className="text-xs text-muted-foreground"
                        >
                          Email
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="border-t pt-4">
        <Button
          variant="gradient"
          icon={guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          iconPosition="left"
          onClick={guardar}
          disabled={guardando}
          className="w-full sm:w-auto"
        >
          {guardando ? "Guardando..." : "Guardar preferencias"}
        </Button>
      </div>
    </div>
  );
}

PreferenciasForm.displayName = "PreferenciasForm";
