"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingOverlay } from "@/components/ui/Loading";
import { DashboardBackLink } from "@/components/DashboardBackLink";
import { ResumenTotales } from "@/components/checkout/ResumenTotales";
import {
  GrupoNegocioCard,
  formatearMoneda,
  formatearTratamientoIVA,
  formatearTasa,
  grupoNoDesglosaIVA,
  itemTieneDetalleFiscal,
  numeroFinito,
  obtenerBaseImponibleGrupo,
  obtenerMontoIVAGrupo,
  obtenerTasaGrupo,
  obtenerTotalGrupo,
  type GrupoFiscalDTO,
  type GrupoNegocioCardGrupo,
  type ItemFiscalDTO,
  type NegocioFiscalDTO,
} from "@/components/checkout/GrupoNegocioCard";
import { PasoCheckout } from "@/components/checkout/PasoCheckout";
import { SelectorFechaEntrega } from "@/components/checkout/SelectorFechaEntrega";
import { MetodoPagoSelector } from "@/components/pagos/MetodoPagoSelector";
import { ShoppingCart, Truck, Store, CreditCard } from "lucide-react";
import type {
  CheckoutPreparadoDTO,
  GrupoCheckoutDTO,
  SeleccionEntregaGrupo,
  TotalesCheckoutDTO,
} from "@/shared/checkout.types";

const PASOS = ["Resumen", "Entrega", "Pago", "Confirmar"] as const;

type GrupoCheckoutFiscal = GrupoCheckoutDTO &
  GrupoFiscalDTO & {
    negocio: GrupoCheckoutDTO["negocio"] & NegocioFiscalDTO;
    items: Array<GrupoCheckoutDTO["items"][number] & ItemFiscalDTO>;
  };

type TotalesCheckoutFiscal = TotalesCheckoutDTO & {
  baseImponible?: number | string | null;
  montoIVA?: number | string | null;
  totalConIVA?: number | string | null;
  regimenFiscal?: "GENERAL" | "SIMPLIFICADO" | "EXENTO" | "NO_SUJETO" | null;
  tasaIVA?: number | string | null;
  modoPrecio?: "IVA_INCLUIDO" | "IVA_AGREGADO" | null;
};

function nombreItem(item: GrupoCheckoutFiscal["items"][number]): string {
  return item.producto?.nombre ?? item.servicio?.nombre ?? "Artículo";
}

function totalItem(item: GrupoCheckoutFiscal["items"][number]): number {
  const precioUnitario =
    numeroFinito(item.precioUnitarioConIVA) ??
    numeroFinito(item.precioUnitario) ??
    0;
  return numeroFinito(item.subtotal) ?? precioUnitario * item.cantidad;
}

function detalleFiscalItem(
  item: GrupoCheckoutFiscal["items"][number]
): string[] {
  const tratamiento = item.tratamientoIVA;
  const tasa = formatearTasa(item.tasaIVA);
  const precioUnitarioConIVA = numeroFinito(item.precioUnitarioConIVA);
  const base = numeroFinito(item.baseImponible);
  const iva = numeroFinito(item.montoIVA);
  const detalles = [
    tratamiento ? formatearTratamientoIVA(tratamiento) : undefined,
    tratamiento === "GRAVADO" && tasa ? `IVA ${tasa}` : undefined,
    precioUnitarioConIVA !== undefined
      ? `Precio final ${formatearMoneda(precioUnitarioConIVA)}`
      : undefined,
    base !== undefined ? `Base ${formatearMoneda(base)}` : undefined,
    iva !== undefined ? `IVA ${formatearMoneda(iva)}` : undefined,
  ].filter((detalle): detalle is string => Boolean(detalle));
  return detalles;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [checkout, setCheckout] = useState<CheckoutPreparadoDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pasoActual, setPasoActual] = useState(0);
  const [seleccion, setSeleccion] = useState<Record<string, SeleccionEntregaGrupo>>({});
  const [fechaEntrega, setFechaEntrega] = useState<Date | null>(null);
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [metodoPago, setMetodoPago] = useState<string>("");
  const [datosPago, setDatosPago] = useState<{ referencia?: string | null; comprobanteUrl?: string | null; notasCliente?: string | null }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/checkout/preparar");
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Error al preparar checkout");
        }
        const result = await res.json();
        if (!cancelled) {
          setCheckout(result);
          const inicial: Record<string, SeleccionEntregaGrupo> = {};
          result.grupos.forEach((g: GrupoCheckoutDTO) => {
            inicial[g.negocioId] = {
              negocioId: g.negocioId,
              tipoEntrega: "DOMICILIO",
              direccionEntrega: result.direccionUsuario ?? undefined,
            };
          });
          setSeleccion(inicial);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!checkout) return;

    const timeout = setTimeout(() => {
      const gruposSeleccion = Object.values(seleccion);
      if (gruposSeleccion.length === 0) return;

      void fetch("/api/checkout/recalcular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grupos: gruposSeleccion }),
      })
        .then((res) => res.json())
        .then((data: TotalesCheckoutDTO | { error: string }) => {
          if (!("error" in data) && checkout) {
            setCheckout((prev) =>
              prev ? { ...prev, totales: data as TotalesCheckoutFiscal } : prev
            );
          }
        })
        .catch(() => {});
    }, 300);

    return () => clearTimeout(timeout);
  }, [seleccion, checkout]);

  const handleSeleccionChange = (
    grupoNegocioId: string,
    nuevaSeleccion: SeleccionEntregaGrupo
  ) => {
    setSeleccion((prev) => ({
      ...prev,
      [grupoNegocioId]: { ...nuevaSeleccion, negocioId: grupoNegocioId },
    }));
  };

  const handleNotasChange = (grupo: GrupoCheckoutDTO, notasStr: string) => {
    setNotas((prev) => ({ ...prev, [grupo.negocioId]: notasStr }));
  };

   const handleNextStep = () => {
    if (!checkout) return;
    
    // Validar paso de pago
    if (pasoActual === 2) {
      if (!metodoPago) {
        alert("Selecciona un método de pago.");
        return;
      }
    }
    
    const allValid = checkout.grupos.every((g) => {
      if (pasoActual === 0) return true; // Resumen siempre válido
      if (pasoActual === 1) {
        const sel = seleccion[g.negocioId];
        if (!sel) return g.disponibilidadOk === false;
        if (sel.tipoEntrega === "DOMICILIO") {
          return sel.direccionEntrega && sel.opcionLogisticaId;
        }
        return true;
      }
      if (pasoActual === 2) {
        const sel = seleccion[g.negocioId];
        if (!sel) return false;
        if (sel.tipoEntrega === "DOMICILIO") {
          return sel.direccionEntrega && sel.opcionLogisticaId;
        }
        return true;
      }
      if (pasoActual === 3) {
        const sel = seleccion[g.negocioId];
        if (!sel) return false;
        if (sel.tipoEntrega === "DOMICILIO") {
          return sel.direccionEntrega && sel.opcionLogisticaId;
        }
        return true;
      }
      return true;
    });
    if (pasoActual === 1 && !allValid) {
      alert("Verifica que todos los grupos tengan la información requerida.");
      return;
    }
    setPasoActual((p) => Math.min(p + 1, PASOS.length - 1));
  };

  const handlePrevStep = () => setPasoActual((p) => Math.max(p - 1, 0));

  const handleConfirmar = async () => {
    if (!checkout) return;
    setSubmitting(true);
    setError(null);

    const payload = {
      checkoutToken: checkout.checkoutToken,
      fechaEntrega: fechaEntrega ? fechaEntrega.toISOString() : undefined,
      metodoPago: metodoPago || undefined,
      datosPago: datosPago || undefined,
      grupos: Object.values(seleccion).map((s) => ({
        ...s,
        notas: notas[s.negocioId] || undefined,
      })),
    };

    try {
      const res = await fetch("/api/checkout/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al confirmar checkout");
      }

      const result = await res.json();
      const pedidosParam = encodeURIComponent(JSON.stringify(result.pedidosCreados));
      router.push(`/checkout/confirmacion?pedidos=${pedidosParam}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto py-12 px-6">
        <LoadingOverlay />
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-6xl mx-auto py-12 px-6">
        <DashboardBackLink />
        <ErrorState
          title="Error en el checkout"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </main>
    );
  }

  if (!checkout) return null;

  const hayItemsSinDisponibilidad = checkout.grupos.some(
    (g) => !g.disponibilidadOk
  );

  return (
    <main className="max-w-6xl mx-auto py-12 px-6">
      <header className="mb-8">
        <DashboardBackLink />
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        <p className="text-muted-foreground">
          {checkout.grupos.length === 1
            ? "Estás comprando en 1 negocio"
            : `Estás comprando en ${checkout.grupos.length} negocios (se crearán ${checkout.grupos.length} pedidos)`}
        </p>
      </header>

      <nav className="mb-8" aria-label="Pasos del checkout">
        <ol className="flex items-center justify-center gap-4">
          {PASOS.map((paso, i) => (
            <PasoCheckout
              key={paso}
              titulo={paso}
              isActive={i === pasoActual}
              isCompleted={i < pasoActual}
              isDisabled={i > pasoActual}
               icono={
                i === 0 ? <ShoppingCart className="h-4 w-4" /> :
                i === 1 ? <Truck className="h-4 w-4" /> :
                i === 2 ? <CreditCard className="h-4 w-4" /> :
                <Store className="h-4 w-4" />
              }
            />
          ))}
        </ol>
      </nav>

      {hayItemsSinDisponibilidad && (
        <div
          className="mb-6 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive"
          role="alert"
        >
          <p className="font-semibold">Algunos productos no están disponibles</p>
          <p className="text-sm mt-1">
            Verás los errores específicos en cada grupo. Corrígelos antes de confirmar.
          </p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {pasoActual === 0 && (
            <section aria-labelledby="resumen-title">
              <h2 id="resumen-title" className="text-xl font-semibold mb-4">
                Resumen de tu compra
              </h2>
              <div className="space-y-4">
                {checkout.grupos.map((grupo) => {
                  const grupoFiscal: GrupoCheckoutFiscal = grupo;
                  const noDesglosaIVA = grupoNoDesglosaIVA(grupoFiscal);
                  const tasaIVA = obtenerTasaGrupo(grupoFiscal);
                  const ivaLabel = tasaIVA === undefined ? "IVA" : `IVA (${tasaIVA})`;

                  return (
                    <details
                      key={grupo.negocioId}
                      className="rounded-lg border border-border bg-surface p-4"
                    >
                      <summary className="cursor-pointer font-semibold text-foreground list-none">
                        <div className="flex justify-between gap-4">
                          <span>{grupo.negocio.nombre}</span>
                          <span className="text-muted-foreground">
                            {grupo.items.length} {grupo.items.length === 1 ? "producto" : "productos"}
                          </span>
                        </div>
                      </summary>
                      <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-3" aria-label={`Desglose fiscal de ${grupo.negocio.nombre}`}>
                        <div className="flex justify-between gap-2">
                          <dt className="text-muted-foreground">Base imponible</dt>
                          <dd className="font-medium whitespace-nowrap">{formatearMoneda(obtenerBaseImponibleGrupo(grupoFiscal))}</dd>
                        </div>
                        {!noDesglosaIVA && (
                          <div className="flex justify-between gap-2">
                            <dt className="text-muted-foreground">{ivaLabel}</dt>
                            <dd className="font-medium whitespace-nowrap">{formatearMoneda(obtenerMontoIVAGrupo(grupoFiscal))}</dd>
                          </div>
                        )}
                        <div className="flex justify-between gap-2">
                          <dt className="font-semibold">Total</dt>
                          <dd className="font-semibold whitespace-nowrap">{formatearMoneda(obtenerTotalGrupo(grupoFiscal))}</dd>
                        </div>
                      </dl>
                      {noDesglosaIVA && (
                        <p className="mt-2 rounded-lg bg-info/10 border border-info/20 p-3 text-sm text-info" role="status">
                          Este negocio no desglosa IVA.
                        </p>
                      )}
                      {!noDesglosaIVA && grupo.items.some((item) => item.tratamientoIVA === "EXENTO" || item.tratamientoIVA === "NO_SUJETO") && (
                        <p className="mt-2 rounded-lg bg-warning/10 border border-warning/20 p-3 text-sm text-warning" role="status">
                          Incluye artículos exentos o no sujetos a IVA.
                        </p>
                      )}
                      <ul className="mt-3 space-y-2 text-sm" aria-label={`Artículos de ${grupo.negocio.nombre}`}>
                        {grupo.items.map((item) => {
                          const itemFiscal = item as GrupoCheckoutFiscal["items"][number];
                          const detalles = detalleFiscalItem(itemFiscal);
                          return (
                            <li key={item.id} className="flex justify-between gap-4">
                              <span className="min-w-0">
                                <span className="block truncate">
                                  {nombreItem(itemFiscal)} × {itemFiscal.cantidad}
                                </span>
                                {itemTieneDetalleFiscal(itemFiscal) && (
                                  <span className="block text-xs text-muted-foreground" aria-label={`Detalle fiscal de ${nombreItem(itemFiscal)}: ${detalles.join(", ")}`}>
                                    {detalles.join(" · ")}
                                  </span>
                                )}
                              </span>
                              <span className="font-medium whitespace-nowrap" aria-label={`Total de ${nombreItem(itemFiscal)}: ${formatearMoneda(totalItem(itemFiscal))}`}>
                                {formatearMoneda(totalItem(itemFiscal))}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  );
                })}
              </div>
            </section>
          )}

          {pasoActual === 1 && (
            <section aria-labelledby="entrega-title">
              <h2 id="entrega-title" className="text-xl font-semibold mb-4">
                Entrega por negocio
              </h2>
              <div className="space-y-6">
                {checkout.grupos.map((grupo) => {
                  const sel = seleccion[grupo.negocioId] ?? {
                    negocioId: grupo.negocioId,
                    tipoEntrega: "DOMICILIO" as const,
                  };
                  return (
                    <div key={grupo.negocioId} className="border border-border rounded-xl p-4">
                      <GrupoNegocioCard
                        grupo={grupo}
                        seleccion={sel}
                        direccionUsuario={checkout.direccionUsuario}
                        onSeleccionChange={(g, s) =>
                          handleSeleccionChange(g.negocioId, { ...s, negocioId: g.negocioId })
                        }
                        onNotasChange={handleNotasChange}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 border-t border-border pt-4">
                <SelectorFechaEntrega
                  items={checkout.grupos.flatMap((g) => g.items)}
                  selectedFecha={fechaEntrega ?? undefined}
                  onChange={setFechaEntrega}
                />
              </div>
            </section>
           )}

           {pasoActual === 2 && (
             <section aria-labelledby="pago-title">
               <h2 id="pago-title" className="text-xl font-semibold mb-4">
                 Método de pago
               </h2>
               <div className="border border-border rounded-xl p-6">
                 <MetodoPagoSelector
                   value={metodoPago}
                   onChange={setMetodoPago}
                 />
               </div>

               {(metodoPago === "TRANSFERENCIA_BANCARIA" || metodoPago === "PAGO_MOVIL") && (
                 <div className="border border-border rounded-xl p-6 mt-4 space-y-4">
                   <h3 className="font-semibold text-foreground">
                     {metodoPago === "TRANSFERENCIA_BANCARIA"
                       ? "Datos de la transferencia"
                       : "Datos de pago móvil"}
                   </h3>

                   <div>
                     <label className="block text-sm font-medium text-foreground mb-1">
                       {metodoPago === "TRANSFERENCIA_BANCARIA"
                         ? "Número de referencia de la transferencia"
                         : "Referencia de pago móvil"}
                     </label>
                     <input
                       type="text"
                       value={datosPago.referencia ?? ""}
                       onChange={(e) =>
                         setDatosPago({ ...datosPago, referencia: e.target.value })
                       }
                       placeholder="Ej: 1234567890"
                       className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-foreground mb-1">
                       Notas (opcional)
                     </label>
                     <textarea
                       value={datosPago.notasCliente ?? ""}
                       onChange={(e) =>
                         setDatosPago({ ...datosPago, notasCliente: e.target.value })
                       }
                       placeholder="Información adicional sobre tu pago..."
                       rows={3}
                       className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                     />
                   </div>
                 </div>
               )}

               <div className="mt-4 rounded-lg bg-muted/30 border border-border p-4">
                 <p className="text-sm text-muted-foreground">
                   <strong>Efectivo contra entrega:</strong> Pagas al recibir tu pedido.
                 </p>
                 <p className="text-sm text-muted-foreground mt-1">
                   <strong>Transferencia bancaria / Pago móvil:</strong> Realiza la transferencia y
                   sube la referencia. El negocio confirmará tu pago.
                 </p>
               </div>
             </section>
           )}

           {pasoActual === 3 && (
             <section aria-labelledby="confirmacion-title">
               <h2 id="confirmacion-title" className="text-xl font-semibold mb-4">
                 Confirma tu pedido
               </h2>
               <div className="space-y-4">
                 {checkout.grupos.map((grupo) => {
                    const sel = seleccion[grupo.negocioId];
                    const grupoFiscal: GrupoCheckoutFiscal = grupo;
                    const noDesglosaIVA = grupoNoDesglosaIVA(grupoFiscal);
                    return (
                      <div
                        key={grupo.negocioId}
                        className="border border-border rounded-xl p-4"
                      >
                        <div className="flex justify-between font-semibold">
                          <span>{grupo.negocio.nombre}</span>
                          <span>
                            {sel?.tipoEntrega === "DOMICILIO" ? "Envío" : "Recogida"}
                          </span>
                        </div>
                        {sel?.tipoEntrega === "DOMICILIO" && sel.direccionEntrega && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Dirección: {sel.direccionEntrega}
                          </p>
                        )}
                        {sel?.opcionLogisticaId && (
                          <p className="text-sm text-muted-foreground">
                            Opción: {sel.opcionLogisticaId}
                          </p>
                        )}
                        {sel?.notas && (
                          <p className="text-sm text-muted-foreground">
                            Notas: {sel.notas}
                          </p>
                        )}
                        {metodoPago && (
                          <p className="text-sm text-muted-foreground">
                            Pago: {metodoPago === "EFECTIVO_CONTRA_ENTREGA" ? "Efectivo contra entrega" :
                              metodoPago === "TRANSFERENCIA_BANCARIA" ? "Transferencia bancaria" :
                              metodoPago === "PAGO_MOVIL" ? "Pago móvil" : metodoPago}
                          </p>
                        )}
                        <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-3" aria-label={`Desglose fiscal de ${grupo.negocio.nombre}`}>
                          <div className="flex justify-between gap-2">
                            <dt className="text-muted-foreground">Base imponible</dt>
                            <dd className="font-medium whitespace-nowrap">{formatearMoneda(obtenerBaseImponibleGrupo(grupoFiscal))}</dd>
                          </div>
                          {!noDesglosaIVA && (
                            <div className="flex justify-between gap-2">
                              <dt className="text-muted-foreground">{obtenerTasaGrupo(grupoFiscal) ? `IVA (${obtenerTasaGrupo(grupoFiscal)})` : "IVA"}</dt>
                              <dd className="font-medium whitespace-nowrap">{formatearMoneda(obtenerMontoIVAGrupo(grupoFiscal))}</dd>
                            </div>
                          )}
                          <div className="flex justify-between gap-2">
                            <dt className="font-semibold">Total</dt>
                            <dd className="font-semibold whitespace-nowrap">{formatearMoneda(obtenerTotalGrupo(grupoFiscal))}</dd>
                          </div>
                        </dl>
                      </div>
                    );
                  })}
               </div>
             </section>
           )}
        </div>

        <div className="lg:col-span-1">
          <ResumenTotales totales={checkout.totales as TotalesCheckoutFiscal} className="sticky top-6" />
          <div className="mt-6 flex gap-3">
            {pasoActual > 0 && (
              <Button variant="outline" onClick={handlePrevStep}>
                Anterior
              </Button>
            )}
            {pasoActual < PASOS.length - 1 ? (
              <Button onClick={handleNextStep} className="flex-1">
                Continuar
              </Button>
            ) : (
              <Button
                onClick={handleConfirmar}
                loading={submitting}
                className="flex-1"
              >
                Confirmar y pagar
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
