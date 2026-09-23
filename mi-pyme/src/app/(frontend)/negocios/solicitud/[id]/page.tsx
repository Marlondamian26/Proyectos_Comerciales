import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSolicitudAltaAction, cancelarSolicitudAltaAction } from "@/lib/actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { XCircle } from "lucide-react";
import Link from "next/link";

interface SolicitudConRelations {
  id: string;
  nombreNegocio: string;
  estado: string;
  descripcion: string | null;
  provincia: string | null;
  municipio: string | null;
  telefono: string | null;
  emailContacto: string | null;
  direccion: string | null;
  subareaIds: string | null;
  motivoRechazo: string | null;
  createdAt: Date;
  area?: { nombre: string } | null;
  user?: { email: string; nombre: string | null };
  aprobadoPor?: { nombre: string | null } | null;
}

interface Props {
  params: Promise<{ id: string }>;
}

const estadoLabels: Record<string, string> = {
  PENDIENTE_APROBACION: "Pendiente de aprobación",
  ACTIVO: "Aprobado",
  RECHAZADO: "Rechazado",
  SUSPENDIDO: "Suspendido",
};

const estadoColors: Record<string, string> = {
  PENDIENTE_APROBACION: "bg-yellow-100 text-yellow-800",
  ACTIVO: "bg-green-100 text-green-800",
  RECHAZADO: "bg-red-100 text-red-800",
  SUSPENDIDO: "bg-gray-100 text-gray-800",
};

export const dynamic = "force-dynamic";

export default async function SolicitudDetallePage({ params }: Props) {
  const session = await auth();
  const { id } = await params;

  if (!session) {
    redirect("/auth/signin");
  }

  const solicitud = (await getSolicitudAltaAction(id)) as SolicitudConRelations | null;

  if (!solicitud) {
    redirect("/mis-solicitudes");
  }

  const negocioActivo = solicitud.estado === "ACTIVO";

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Solicitud de alta
            </h1>
            <p className="text-muted-foreground mt-1">
              Negocio: {solicitud.nombreNegocio}
            </p>
          </div>
          <Badge className={estadoColors[solicitud.estado] ?? ""}>
            {estadoLabels[solicitud.estado] ?? solicitud.estado}
          </Badge>
        </div>

        <Card className="mb-6">
          <div className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Nombre del negocio</label>
                <p className="mt-1 font-medium">{solicitud.nombreNegocio}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Área</label>
                <p className="mt-1 font-medium">{solicitud.area?.nombre ?? "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Provincia</label>
                <p className="mt-1 font-medium">{solicitud.provincia ?? "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Municipio</label>
                <p className="mt-1 font-medium">{solicitud.municipio ?? "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Teléfono</label>
                <p className="mt-1 font-medium">{solicitud.telefono ?? "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Email</label>
                <p className="mt-1 font-medium">{solicitud.emailContacto ?? "—"}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground uppercase">Dirección</label>
                <p className="mt-1 font-medium">{solicitud.direccion ?? "—"}</p>
              </div>
              {solicitud.area && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">Subáreas</label>
                  <p className="mt-1 font-medium">
                    {(() => {
                      try {
                        const ids = JSON.parse(solicitud.subareaIds ?? "[]");
                        return Array.isArray(ids) && ids.length > 0
                          ? ids.join(", ")
                          : "—";
                      } catch {
                        return "—";
                      }
                    })()}
                  </p>
                </div>
              )}
              {solicitud.descripcion && (
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Descripción</label>
                  <p className="mt-1 text-sm">{solicitud.descripcion}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {solicitud.motivoRechazo && (
          <Card className="mb-6 border-destructive/20 bg-destructive/5">
            <div className="p-4">
              <label className="text-xs font-medium text-destructive uppercase">Motivo de rechazo</label>
              <p className="mt-1 text-sm text-destructive">{solicitud.motivoRechazo}</p>
            </div>
          </Card>
        )}

        {solicitud.estado === "PENDIENTE_APROBACION" && (
          <form action={async () => {
            "use server";
            await cancelarSolicitudAltaAction(solicitud.id);
          }}>
            <Button variant="outline" type="submit" icon={<XCircle className="h-4 w-4" />}>
              Cancelar solicitud
            </Button>
          </form>
        )}

        {negocioActivo && (
          <div className="mt-4">
            <Button asChild>
              <Link href="/negocio">Ir a mi panel de negocio</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
