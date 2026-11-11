import { auth } from "@/lib/auth";
import { obtenerNegocioDelUsuario, listarAreasAction } from "@/lib/actions";
import MiNegocioForm from "@/components/negocio/MiNegocioForm";
import DatosFiscalesForm from "@/components/fiscal/DatosFiscalesForm";
import { EmptyStatePreset } from "@/components/ui/EmptyState";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

function formatFiscalValue(value: unknown, labels: Record<string, string>): string {
  return typeof value === "string" ? labels[value] ?? value : "—";
}

export default async function MiNegocioPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  const negocio = userId ? await obtenerNegocioDelUsuario(userId) : null;
  const areas = await listarAreasAction();

  if (!negocio) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <EmptyStatePreset
            preset="search"
            action={{
              label: "Solicitar alta de negocio",
              href: "/negocios/solicitar",
            }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <section id="datos-fiscales" className="scroll-mt-24 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Datos fiscales</h1>
            <p className="text-muted-foreground mt-1">
              Configuración tributaria y de facturación del negocio
            </p>
          </div>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 rounded-lg border bg-muted/20 p-4">
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Régimen fiscal</dt>
            <dd className="mt-1 text-lg font-semibold">
              {formatFiscalValue(negocio.regimenFiscal, {
                GENERAL: "General",
                SIMPLIFICADO: "Simplificado",
                EXENTO: "Exento",
                NO_SUJETO: "No sujeto",
              })}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Tasa de IVA</dt>
            <dd className="mt-1 text-lg font-semibold">
              {negocio.tasaIVA == null ? "—" : `${Number(negocio.tasaIVA).toFixed(2)}%`}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Modo de precio</dt>
            <dd className="mt-1 text-lg font-semibold">
              {formatFiscalValue(negocio.modoPrecio, {
                IVA_INCLUIDO: "IVA incluido",
                IVA_AGREGADO: "IVA agregado",
              })}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">NIT</dt>
            <dd className="mt-1 text-lg font-semibold">{negocio.nit || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Prefijo de factura</dt>
            <dd className="mt-1 text-lg font-semibold">{negocio.prefijoFactura || "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="mb-8">
        <DatosFiscalesForm
          negocioId={negocio.id}
          datosIniciales={{
            regimenFiscal: negocio.regimenFiscal ?? "GENERAL",
            tasaIVA: Number(negocio.tasaIVA ?? 10),
            modoPrecio: negocio.modoPrecio ?? "IVA_INCLUIDO",
            nit: negocio.nit ?? null,
            direccionFiscal: negocio.direccionFiscal ?? null,
            telefonoFiscal: negocio.telefonoFiscal ?? null,
            emailFiscal: negocio.emailFiscal ?? null,
            prefijoFactura: negocio.prefijoFactura ?? "PR",
          }}
        />
      </section>

      <MiNegocioForm negocio={negocio} areas={areas} />
    </main>
  );
}
