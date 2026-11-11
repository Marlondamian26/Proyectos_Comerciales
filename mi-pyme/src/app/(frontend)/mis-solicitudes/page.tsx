import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { listarSolicitudesUsuarioAction } from "@/lib/actions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyStatePreset } from "@/components/ui/EmptyState";
import Link from "next/link";

export const dynamic = "force-dynamic";

const estadoLabels: Record<string, string> = {
  PENDIENTE_APROBACION: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  CANCELADA: "Cancelada",
  SUSPENDIDA: "Suspendida",
};

const estadoColors: Record<string, string> = {
  PENDIENTE_APROBACION: "bg-warning/10 text-warning-foreground",
  APROBADA: "bg-success/10 text-success",
  RECHAZADA: "bg-destructive/10 text-destructive",
  CANCELADA: "bg-muted text-muted-foreground",
  SUSPENDIDA: "bg-muted text-muted-foreground",
};

interface SolicitudUsuario {
  id: string;
  nombreNegocio: string;
  estado: string;
  provincia: string | null;
  createdAt: Date;
  area?: { nombre: string } | null;
}

export default async function MisSolicitudesPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  if (!session) {
    redirect("/auth/login");
  }

  if (session.user?.rol === Rol.ADMIN) {
    redirect("/admin/solicitudes");
  }

  const solicitudes: SolicitudUsuario[] = await listarSolicitudesUsuarioAction(userId);
  const puedeSolicitarRol = session.user?.rol === Rol.CLIENTE;

  return (
    <main className="min-h-screen app-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Mis solicitudes
            </h1>
            <p className="text-muted-foreground mt-1">
              Estado de tus solicitudes de cambio de rol
            </p>
          </div>
          <Link
            href={puedeSolicitarRol ? "/solicitar-rol" : "/solicitar-rol/estado"}
            className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90"
          >
            {puedeSolicitarRol ? "+ Nueva solicitud" : "Ver estado"}
          </Link>
        </div>

        {solicitudes.length === 0 ? (
          <EmptyStatePreset preset="search" />
        ) : (
          <div className="space-y-4">
            {solicitudes.map((s) => (
              <Card key={s.id} className="p-4">
                <Link href={`/negocios/solicitud/${s.id}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{s.nombreNegocio}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {s.area?.nombre ?? "Sin categoría"} · {s.provincia ?? "Sin provincia"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Solicitada el {new Date(s.createdAt).toLocaleDateString("es-AR")}
                      </p>
                    </div>
                    <Badge className={estadoColors[s.estado] ?? ""}>
                      {estadoLabels[s.estado] ?? s.estado}
                    </Badge>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
