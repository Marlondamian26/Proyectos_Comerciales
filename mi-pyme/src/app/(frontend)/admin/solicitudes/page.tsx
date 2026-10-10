import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import {
  listarSolicitudesRolAction,
  aprobarSolicitudRolAction,
  rechazarSolicitudRolAction,
} from "@/lib/actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyStatePreset } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

const estadosSolicitud = [
  "PENDIENTE_APROBACION",
  "APROBADA",
  "RECHAZADA",
  "CANCELADA",
  "SUSPENDIDA",
] as const;
const tiposSolicitud = ["NEGOCIO", "LOGISTICA"] as const;

const estadoColors: Record<string, string> = {
  PENDIENTE_APROBACION: "bg-warning/10 text-warning-foreground",
  APROBADA: "bg-success/10 text-success",
  RECHAZADA: "bg-destructive/10 text-destructive",
  CANCELADA: "bg-muted text-muted-foreground",
  SUSPENDIDA: "bg-muted text-muted-foreground",
};

function formatTiposEnvio(value: string | null): string {
  if (!value) return "No especificados";
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      return parsed.join(", ");
    }
  } catch {
    return value;
  }
  return value;
}

export default async function AdminSolicitudesPage({
  searchParams,
}: {
  searchParams?: Promise<{ tipo?: string; estado?: string }>;
}) {
  const session = await auth();
  if (!session || session.user?.rol !== Rol.ADMIN) {
    redirect("/");
  }

  const params = (await searchParams) ?? {};
  const tipo = tiposSolicitud.find((option) => option === params.tipo);
  const estado = estadosSolicitud.find((option) => option === params.estado);
  const solicitudes = await listarSolicitudesRolAction({
    tipo,
    estado:
      params.estado === "TODAS"
        ? undefined
        : estado ?? "PENDIENTE_APROBACION",
  });

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Solicitudes de rol
          </h1>
          <p className="mt-1 text-muted-foreground">
            {solicitudes.length} solicitud{solicitudes.length === 1 ? "" : "es"}
          </p>
        </header>

        <form
          method="get"
          className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-border bg-card p-4"
        >
          <label className="flex flex-col gap-1 text-sm font-medium">
            Tipo
            <select
              name="tipo"
              defaultValue={tipo ?? ""}
              className="h-10 rounded-md border border-border bg-background px-3"
            >
              <option value="">Todos</option>
              {tiposSolicitud.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Estado
            <select
              name="estado"
              defaultValue={
                params.estado === "TODAS"
                  ? "TODAS"
                  : estado ?? "PENDIENTE_APROBACION"
              }
              className="h-10 rounded-md border border-border bg-background px-3"
            >
              <option value="TODAS">Todos</option>
              {estadosSolicitud.map((option) => (
                <option key={option} value={option}>{option.replaceAll("_", " ")}</option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="secondary">Filtrar</Button>
        </form>

        {solicitudes.length === 0 ? (
          <EmptyStatePreset preset="search" />
        ) : (
          <div className="space-y-4">
            {solicitudes.map((solicitud) => (
              <Card key={solicitud.id} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold">
                        {solicitud.nombreNegocio}
                      </h2>
                      <Badge>{solicitud.tipo}</Badge>
                      <Badge className={estadoColors[solicitud.estado] ?? ""}>
                        {solicitud.estado.replaceAll("_", " ")}
                      </Badge>
                    </div>
                    <div className="grid gap-3 text-sm md:grid-cols-2">
                      <p>
                        <span className="text-muted-foreground">Solicitante: </span>
                        {solicitud.user.nombre ?? solicitud.user.email}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Área: </span>
                        {solicitud.area?.nombre ?? "—"}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Provincia: </span>
                        {solicitud.provincia ?? "—"}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Municipio: </span>
                        {solicitud.municipio ?? "—"}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Teléfono: </span>
                        {solicitud.telefono ?? "—"}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Email: </span>
                        {solicitud.emailContacto ?? "—"}
                      </p>
                      {solicitud.tipo === "LOGISTICA" && (
                        <>
                          <p>
                            <span className="text-muted-foreground">Cobertura nacional: </span>
                            {solicitud.alcanceNacional ? "Sí" : "No"}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Tipos de envío: </span>
                            {formatTiposEnvio(solicitud.tiposEnvio)}
                          </p>
                        </>
                      )}
                    </div>
                    {solicitud.descripcion && (
                      <p className="text-sm">{solicitud.descripcion}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Solicitada el{" "}
                      {new Date(solicitud.createdAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>

                  {solicitud.estado === "PENDIENTE_APROBACION" && (
                    <div className="flex w-full flex-col gap-3 md:w-72">
                      <form
                        action={async () => {
                          "use server";
                          await aprobarSolicitudRolAction(solicitud.id);
                        }}
                      >
                        <Button type="submit" variant="primary" className="w-full">
                          Aprobar
                        </Button>
                      </form>
                      <form
                        action={async (formData: FormData) => {
                          "use server";
                          await rechazarSolicitudRolAction(
                            solicitud.id,
                            String(formData.get("motivo") ?? "")
                          );
                        }}
                        className="space-y-2"
                      >
                        <label
                          htmlFor={`motivo-${solicitud.id}`}
                          className="text-sm font-medium"
                        >
                          Motivo del rechazo
                        </label>
                        <textarea
                          id={`motivo-${solicitud.id}`}
                          name="motivo"
                          minLength={20}
                          required
                          aria-describedby={`motivo-help-${solicitud.id}`}
                          className="min-h-20 w-full rounded-md border border-border bg-background p-2 text-sm"
                          placeholder="Explica el motivo (mínimo 20 caracteres)"
                        />
                        <p
                          id={`motivo-help-${solicitud.id}`}
                          className="text-xs text-muted-foreground"
                        >
                          El solicitante verá este motivo en el estado de su solicitud.
                        </p>
                        <Button type="submit" variant="destructive" className="w-full">
                          Rechazar
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
