import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { listarMisSolicitudesAction, cancelarSolicitudRolAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

const estadoLabels: Record<string, string> = {
  PENDIENTE_APROBACION: "Pendiente de aprobación",
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

export default async function EstadoSolicitudRolPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=%2Fsolicitar-rol%2Festad");
  }
  if (
    ![
      Rol.CLIENTE,
      Rol.NEGOCIO,
      Rol.LOGISTICA,
    ].includes(session.user.rol ?? Rol.CLIENTE)
  ) {
    redirect("/");
  }

  const solicitudes = await listarMisSolicitudesAction();

  return (
    <main className="min-h-screen app-background">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Estado de mis solicitudes
            </h1>
            <p className="mt-2 text-muted-foreground">
              Consulta el resultado de tus solicitudes para operar en Mi-Pyme.
            </p>
          </div>
          {session.user.rol === Rol.CLIENTE && (
            <Link
              href="/solicitar-rol"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Nueva solicitud
            </Link>
          )}
        </header>

        {solicitudes.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="font-medium">Aún no has enviado solicitudes.</p>
            {session.user.rol === Rol.CLIENTE && (
              <Link
                href="/solicitar-rol"
                className="mt-4 inline-block text-primary underline"
              >
                Solicitar un cambio de rol
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {solicitudes.map((solicitud) => (
              <Card key={solicitud.id} className="space-y-4 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {solicitud.nombreNegocio}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Solicitud para rol {solicitud.tipo}
                    </p>
                  </div>
                  <Badge className={estadoColors[solicitud.estado] ?? ""}>
                    {estadoLabels[solicitud.estado] ?? solicitud.estado}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enviada el{" "}
                  {new Date(solicitud.createdAt).toLocaleDateString("es-ES")}
                </p>
                {solicitud.motivoRechazo && solicitud.estado === "RECHAZADA" && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                    <h3 className="font-medium">Motivo del rechazo</h3>
                    <p className="mt-1 text-sm">{solicitud.motivoRechazo}</p>
                  </div>
                )}
                {solicitud.estado === "PENDIENTE_APROBACION" && (
                  <form
                    action={async () => {
                      "use server";
                      await cancelarSolicitudRolAction(solicitud.id);
                    }}
                  >
                    <Button type="submit" variant="ghost">
                      Cancelar solicitud
                    </Button>
                  </form>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
