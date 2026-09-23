import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import {
  listarSolicitudesPendientesAction,
  aprobarNegocioAction,
  rechazarNegocioAction,
} from "@/lib/actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyStatePreset } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

interface SolicitudConRelaciones {
  id: string;
  nombreNegocio: string;
  estado: string;
  provincia: string | null;
  municipio: string | null;
  telefono: string | null;
  emailContacto: string | null;
  createdAt: Date;
  area?: { nombre: string } | null;
  user?: { email: string; nombre: string | null };
}

const estadoColors: Record<string, string> = {
  PENDIENTE_APROBACION: "bg-yellow-100 text-yellow-800",
  ACTIVO: "bg-green-100 text-green-800",
  RECHAZADO: "bg-red-100 text-red-800",
  SUSPENDIDO: "bg-gray-100 text-gray-800",
};

export default async function AdminSolicitudesPage() {
  const session = await auth();

  if (!session || session.user?.rol !== Rol.ADMIN) {
    redirect("/");
  }

  const solicitudes: SolicitudConRelaciones[] = await listarSolicitudesPendientesAction();

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Solicitudes de alta (admin)
            </h1>
            <p className="text-muted-foreground mt-1">
              {solicitudes.length} solicitudes pendientes de aprobación
            </p>
          </div>
        </div>

        {solicitudes.length === 0 ? (
          <EmptyStatePreset preset="search" />
        ) : (
          <div className="space-y-4">
            {solicitudes.map((s) => (
              <Card key={s.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold">{s.nombreNegocio}</h2>
                      <Badge className={estadoColors[s.estado] ?? ""}>
                        {s.estado}
                      </Badge>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Solicitante:</span>{" "}
                        {s.user?.nombre ?? s.user?.email ?? "—"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Área:</span>{" "}
                        {s.area?.nombre ?? "—"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Provincia:</span>{" "}
                        {s.provincia ?? "—"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Municipio:</span>{" "}
                        {s.municipio ?? "—"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Teléfono:</span>{" "}
                        {s.telefono ?? "—"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>{" "}
                        {s.emailContacto ?? "—"}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Solicitada el {new Date(s.createdAt).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <form action={async () => {
                      "use server";
                      await aprobarNegocioAction(s.id);
                    }}>
                      <Button variant="primary" size="sm">
                        Aprobar
                      </Button>
                    </form>
                    <form action={async () => {
                      "use server";
                      await rechazarNegocioAction(s.id, "Solicitud rechazada por el administrador");
                    }}>
                      <Button variant="destructive" size="sm">
                        Rechazar
                      </Button>
                    </form>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
