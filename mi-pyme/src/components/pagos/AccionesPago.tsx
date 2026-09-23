"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { PagoConRelacionesDTO } from "@/shared/pagos.types";

export interface AccionesPagoProps {
  pago: PagoConRelacionesDTO;
  rolActual: "CLIENTE" | "NEGOCIO" | "ADMIN";
  className?: string;
  onAction?: () => void;
}

interface AccionDef {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant: ButtonVariant;
  requiresMotivo?: boolean;
  confirmText?: string;
}

export function AccionesPago({
  pago,
  rolActual,
  className,
  onAction,
}: AccionesPagoProps) {
  const [accionLoading, setAccionLoading] = useState<string | null>(null);
  const [codigoAccion, setCodigoAccion] = useState<"confirmar" | "validar" | null>(null);
  const [codigoInput, setCodigoInput] = useState("");

  const handleAccion = async (accion: AccionDef, payload?: Record<string, unknown>) => {
    setAccionLoading(accion.key);
    try {
      const res = await fetch(`/api/pagos/${pago.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: accion.key, ...payload }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Error en la operación");
      } else {
        onAction?.();
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setAccionLoading(null);
    }
  };

  const handleConfirmarConCodigo = async () => {
    if (!codigoInput.trim()) {
      alert("Ingresa el código de 6 dígitos");
      return;
    }
    setAccionLoading("confirmar_con_codigo");
    try {
      const res = await fetch(`/api/pagos/${pago.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "confirmar_con_codigo",
          codigo: codigoInput.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Error al confirmar con código");
      } else {
        onAction?.();
        setCodigoAccion(null);
        setCodigoInput("");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setAccionLoading(null);
    }
  };

  const acciones = getAcciones(pago, rolActual);

  if (acciones.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay acciones disponibles para este pago.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-3", className)} aria-label="Acciones de pago">
      {acciones.map((a) => (
        <AccionButton
          key={a.key}
          accion={a}
          loading={accionLoading === a.key}
          onClick={() => {
            if (a.key === "confirmar_con_codigo") {
              setCodigoAccion("confirmar");
              setCodigoInput("");
            } else {
              handleAccion(a);
            }
          }}
        />
      ))}

      {codigoAccion === "confirmar" && (
        <Modal
          isOpen={true}
          onClose={() => { setCodigoAccion(null); setCodigoInput(""); }}
          title="Confirmar con código de entrega"
        >
          <p className="text-sm text-muted-foreground mb-4">
            Ingresa el código de 6 dígitos que entregó el cliente para confirmar el pago.
          </p>
          <div className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Código de 6 dígitos"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-center text-2xl font-mono tracking-[0.2em] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCodigoAccion(null);
                  setCodigoInput("");
                }}
                disabled={accionLoading === "confirmar_con_codigo"}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmarConCodigo}
                loading={accionLoading === "confirmar_con_codigo"}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AccionButton({
  accion,
  loading,
  onClick,
}: {
  accion: AccionDef;
  loading: boolean;
  onClick: () => void;
}) {
  if (accion.requiresMotivo) {
    return (
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const motivo = (e.currentTarget.elements.namedItem("motivo") as HTMLInputElement).value;
          onClick();
        }}
        className="flex items-end gap-2"
      >
        <input
          name="motivo"
          placeholder={`Motivo (${accion.label})`}
          className="max-w-64 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          required
          minLength={3}
          aria-label={`Motivo para ${accion.label}`}
        />
        <Button type="submit" variant={accion.variant} size="sm" loading={loading}>
          {accion.icon}
          {accion.label}
        </Button>
      </form>
    );
  }

  return (
    <Button
      variant={accion.variant}
      size="sm"
      loading={loading}
      onClick={() => {
        if (accion.confirmText) {
          const confirmed = confirm(accion.confirmText);
          if (!confirmed) return;
        }
        onClick();
      }}
    >
      {accion.icon}
      {accion.label}
    </Button>
  );
}

function getAcciones(pago: PagoConRelacionesDTO, rol: "CLIENTE" | "NEGOCIO" | "ADMIN"): AccionDef[] {
  const accs: AccionDef[] = [];

  if (pago.estado === "PENDIENTE" || pago.estado === "EN_PROCESO") {
    if (rol === "CLIENTE") {
      accs.push({
        key: "cancelar",
        label: "Cancelar pago",
        icon: <span>🚫</span>,
        variant: "outline",
        confirmText: "¿Estás seguro de cancelar este pago?",
      });
    }
  }

  if ((pago.estado === "PENDIENTE" || pago.estado === "EN_PROCESO") && (rol === "NEGOCIO" || rol === "ADMIN")) {
    if (pago.metodo === "EFECTIVO_CONTRA_ENTREGA" && pago.codigoEntregaHash) {
      accs.push({
        key: "confirmar_con_codigo",
        label: "Confirmar con código",
        variant: "primary",
      });
    } else {
      accs.push({
        key: "confirmar",
        label: "Confirmar pago",
        icon: <span>✓</span>,
        variant: "primary",
      });
    }
    accs.push({
      key: "rechazar",
      label: "Rechazar pago",
      icon: <span>✕</span>,
      variant: "destructive",
      requiresMotivo: true,
    });
  }

  if (pago.estado === "COMPLETADO" && rol === "ADMIN") {
    accs.push({
      key: "reembolsar",
      label: "Reembolsar pago",
      icon: <span>↩</span>,
      variant: "destructive",
      requiresMotivo: true,
    });
  }

  return accs;
}

AccionesPago.displayName = "AccionesPago";
