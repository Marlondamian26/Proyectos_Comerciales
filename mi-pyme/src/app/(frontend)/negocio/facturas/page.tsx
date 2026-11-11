import { auth } from "@/lib/auth";
import { listarFacturas } from "@/lib/actions";
import { DashboardBackLink } from "@/components/DashboardBackLink";
import { Card } from "@/components/ui/Card";
import { EmptyStatePreset } from "@/components/ui/EmptyState";
import { FileText } from "lucide-react";
import Link from "next/link";

interface Factura {
  id: string;
  numero: string;
  fecha: string;
  estado: string;
  total: number;
  baseImponible: number | null;
  montoIVA: number | null;
}

export default async function NegocioFacturasPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <DashboardBackLink />
          <p className="text-muted-foreground">
            Debe iniciar sesión para ver sus facturas.
          </p>
        </div>
      </main>
    );
  }

  const negocioId =
    (session.user as { negocio?: { id?: string } }).negocio?.id ?? null;

  if (!negocioId) {
    return (
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <DashboardBackLink />
          <p className="text-muted-foreground">
            Su usuario no está asociado a un negocio.
          </p>
        </div>
      </main>
    );
  }

  const result = await listarFacturas(negocioId);
  const facturas: Factura[] = (result as { facturas?: Factura[] })?.facturas ?? [];

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-6">
          <DashboardBackLink />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            Mis Facturas
          </h1>
          <p className="text-muted-foreground mt-1">
            Historial de facturas emitidas por su negocio
          </p>
        </div>

        {facturas.length === 0 ? (
          <EmptyStatePreset preset="orders" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {facturas.map((f) => (
              <Link key={f.id} href={`/facturas/${f.id}`}>
                <Card className="p-4 hover:border-primary transition-colors cursor-pointer">
                  <header className="flex items-center justify-between mb-3">
                    <span className="font-mono text-sm font-semibold">
                      {f.numero}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-muted/30">
                      {new Date(f.fecha).toLocaleDateString("es-ES")}
                    </span>
                  </header>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Base imponible</dt>
                      <dd>${Number(f.baseImponible ?? 0).toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">IVA</dt>
                      <dd>${Number(f.montoIVA ?? 0).toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <dt>TOTAL</dt>
                      <dd>${Number(f.total).toFixed(2)}</dd>
                    </div>
                  </dl>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
