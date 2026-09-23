"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardBackLink } from "@/components/DashboardBackLink";
import { ReciboPago } from "@/components/pagos/ReciboPago";
import { ComprobanteForm } from "@/components/pagos/ComprobanteForm";
import { AccionesPago } from "@/components/pagos/AccionesPago";
import { Card } from "@/components/ui/Card";
import { LoadingOverlay } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChevronLeft, CreditCard, QrCode } from "lucide-react";
import { CodigoEntregaCard } from "@/components/pagos/CodigoEntregaCard";
import { useToast } from "@/components/ui/Toast";
import type { PagoConRelacionesDTO } from "@/shared/pagos.types";

interface Props {
  pago: PagoConRelacionesDTO | null;
  error: string | null;
  rolActual: "CLIENTE" | "NEGOCIO" | "ADMIN";
  pagoId: string;
}

export default function PagoDetalleClient({ pago: pagoInicial, error: errorInicial, rolActual, pagoId }: Props) {
  const router = useRouter();
  const [pago, setPago] = useState<PagoConRelacionesDTO | null>(pagoInicial);
  const [loading, setLoading] = useState(!pagoInicial && !errorInicial);
  const [error, setError] = useState<string | null>(errorInicial);
  const { addToast } = useToast();

  useEffect(() => {
    if (!pagoInicial && !errorInicial) {
      fetch(`/api/pagos/${pagoId}`)
        .then(async (res) => {
          if (!res.ok) throw new Error("No se pudo cargar el pago");
          return res.json();
        })
        .then((data) => {
          setPago(data);
          setError(null);
        })
        .catch(() => {
          setError("No se pudo cargar el pago");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [pagoInicial, errorInicial, pagoId]);

  const handleSubirComprobante = useCallback(async (datos: { referencia?: string | null; comprobanteUrl?: string | null; idTransferencia?: string | null; entidadPago?: string | null; notasCliente?: string | null }) => {
    const res = await fetch(`/api/pagos/${pago?.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "subir_comprobante", datos }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Error al subir comprobante");
    }
    const updated = await res.json();
    setPago(updated);
    addToast({ message: "Comprobante subido correctamente", variant: "success", title: "Éxito" });
  }, [pago, addToast]);

  if (loading || (!pago && !error)) {
    return (
      <main className="max-w-4xl mx-auto py-12 px-6">
        <DashboardBackLink />
        {loading ? <LoadingOverlay /> : <EmptyState title="Pago no encontrado" icon={<CreditCard className="h-12 w-12" />} />}
      </main>
    );
  }

  if (error || !pago) {
    return (
      <main className="max-w-4xl mx-auto py-12 px-6">
        <DashboardBackLink />
        <EmptyState title={error || "Pago no encontrado"} icon={<CreditCard className="h-12 w-12" />} />
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <button
        onClick={() => router.push("/pagos")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a mis pagos
      </button>

      <ReciboPago pago={pago} className="mb-6" />

      {/* Código de entrega para EFECTIVO_CONTRA_ENTREGA (CLIENTE) */}
      {rolActual === "CLIENTE" && pago.metodo === "EFECTIVO_CONTRA_ENTREGA" && pago.codigoEntregaHash && (
        <CodigoEntregaCard pago={pago} />
      )}

      <Card className="p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Acciones</h2>
        <AccionesPago pago={pago} rolActual={rolActual} onAction={() => router.refresh()} />
      </Card>

      {(pago.estado === "PENDIENTE" && (pago.metodo === "TRANSFERENCIA_BANCARIA" || pago.metodo === "PAGO_MOVIL")) && (
        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Subir comprobante</h2>
           <ComprobanteForm
             pagoId={pago.id}
             metodo={pago.metodo}
             initialReferencia={pago.referencia ?? undefined}
             initialIdTransferencia={pago.idTransferencia ?? undefined}
             initialEntidadPago={pago.entidadPago ?? undefined}
             initialNotas={pago.notasCliente ?? undefined}
             onSubmit={handleSubirComprobante}
           />
        </Card>
      )}
    </main>
  );
}
