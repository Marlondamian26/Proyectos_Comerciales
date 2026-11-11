import { auth } from "@/lib/auth";
import { getFacturaAction, descargarFacturaAction } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { DashboardBackLink } from "@/components/DashboardBackLink";
import { FileText, Download, ShoppingBasket, Calendar } from "lucide-react";
import { RegimenFiscalBadge } from "@/components/fiscal/RegimenFiscalBadge";
import { TratamientoIVABadge } from "@/components/fiscal/TratamientoIVABadge";

interface FacturaItem {
  id: string;
  cantidad: number;
  precioUnitario: number;
  precioUnitarioBase: number;
  precioUnitarioConIVA: number;
  tasaIVA: number;
  tratamientoIVA: string;
  baseImponible: number;
  montoIVA: number;
  subtotal: number;
  producto?: { nombre: string } | null;
  servicio?: { nombre: string } | null;
}

interface Factura {
  id: string;
  numero: string;
  fecha: string;
  estado: string;
  subtotal: number;
  impuestos: number;
  total: number;
  baseImponible: number | null;
  montoIVA: number | null;
  nitEmisor: string | null;
  nitReceptor: string | null;
  negocio?: { id: string; nombre: string; nit: string | null } | null;
  pedido?: { id: string; estado: string; total: number; fechaCreacion: string } | null;
  items: FacturaItem[];
}

export default async function FacturaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const factura = (await getFacturaAction(id)) as unknown as Factura;

  return (
    <main className="max-w-5xl mx-auto py-12 px-6">
      <div className="flex items-center gap-3 mb-6">
        <DashboardBackLink />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            Factura {factura.numero}
          </h1>
          <p className="text-muted-foreground mt-1">
            Fecha: {new Date(factura.fecha).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <form action={async () => {
          "use server";
          const result = await descargarFacturaAction(id);
          "use client";
        }}>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const res = await fetch(`/api/facturas/${id}?html=true`);
              const html = await res.text();
              const blob = new Blob([html], { type: "text/html" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `factura-${factura.numero}.html`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar HTML
          </Button>
        </form>
      </div>

      <section className="grid gap-6 sm:grid-cols-2 mb-6">
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="font-medium text-sm text-muted-foreground uppercase">Emisor</h3>
          <p className="mt-1 font-semibold">{factura.negocio?.nombre ?? "—"}</p>
          <p className="text-sm text-muted-foreground">NIT: {factura.nitEmisor ?? "—"}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="font-medium text-sm text-muted-foreground uppercase">Receptor</h3>
          <p className="mt-1 font-semibold">NIT: {factura.nitReceptor ?? "—"}</p>
        </div>
      </section>

      {factura.negocio && !factura.nitEmisor && (
        <div
          className="mb-6 rounded-lg bg-warning/10 border border-warning/20 p-4 text-sm text-warning"
          role="alert"
        >
          <p className="font-semibold">Atención:</p>
          <p>
            El negocio aún no ha configurado su NIT. Configure su NIT para emitir
            facturas válidas.
          </p>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left py-3 px-4 font-semibold">Concepto</th>
              <th className="text-center py-3 px-4 font-semibold">Cant.</th>
              <th className="text-right py-3 px-4 font-semibold">Precio U. (con IVA)</th>
              <th className="text-center py-3 px-4 font-semibold">Tratamiento</th>
              <th className="text-right py-3 px-4 font-semibold">Base</th>
              <th className="text-right py-3 px-4 font-semibold">IVA</th>
              <th className="text-right py-3 px-4 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {factura.items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-3 px-4">
                  {item.producto?.nombre ?? item.servicio?.nombre ?? "Artículo"}
                </td>
                <td className="py-3 px-4 text-center">{item.cantidad}</td>
                <td className="py-3 px-4 text-right">
                  ${Number(item.precioUnitarioConIVA).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-center">
                  <TratamientoIVABadge tratamiento={item.tratamientoIVA as "GRAVADO" | "EXENTO" | "NO_SUJETO"} />
                </td>
                <td className="py-3 px-4 text-right">
                  ${Number(item.baseImponible).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right">
                  ${Number(item.montoIVA).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-semibold">
                  ${Number(item.subtotal).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mb-6">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <dt className="text-muted-foreground">Base imponible</dt>
            <dd>${Number(factura.baseImponible ?? factura.subtotal).toFixed(2)}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-muted-foreground">IVA</dt>
            <dd>${Number(factura.montoIVA ?? factura.impuestos).toFixed(2)}</dd>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <dt>TOTAL</dt>
            <dd>${Number(factura.total).toFixed(2)}</dd>
          </div>
        </div>
      </div>

      {factura.pedido && (
        <div className="text-sm text-muted-foreground">
          Relacionado con pedido #{factura.pedido.id.slice(0, 8)}
        </div>
      )}
    </main>
  );
}
