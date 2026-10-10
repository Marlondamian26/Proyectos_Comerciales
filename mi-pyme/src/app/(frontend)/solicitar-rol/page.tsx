import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import { getDashboardPath } from "@/lib/auth/dashboard-paths";
import { listarAreas, listarMisSolicitudesAction, listarSubareas } from "@/lib/actions";
import SolicitudRolForm from "@/components/solicitudes/SolicitudRolForm";
import type { Area, Subarea } from "@/generated/prisma/client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SolicitarRolPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=%2Fsolicitar-rol");
  }
  if (session.user.rol !== Rol.CLIENTE) {
    redirect(getDashboardPath(session.user.rol ?? Rol.CLIENTE));
  }

  const solicitudes = await listarMisSolicitudesAction();
  if (solicitudes.some((solicitud) => solicitud.estado === "PENDIENTE_APROBACION")) {
    redirect("/solicitar-rol/estado");
  }

  const areas: Area[] = await listarAreas();
  const subareas = await Promise.all(
    areas.map(async (area) => [area.id, await listarSubareas(area.id)] as const)
  );
  const subareasByArea = Object.fromEntries(subareas) as Record<string, Subarea[]>;

  return (
    <main className="min-h-screen app-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Solicitar cambio de rol
          </h1>
          <p className="mt-2 text-muted-foreground">
            Elige si deseas operar un negocio o prestar servicios de logística.
            Un administrador revisará tu solicitud.
          </p>
        </header>
        <SolicitudRolForm areas={areas} subareasByArea={subareasByArea} />
      </div>
    </main>
  );
}
