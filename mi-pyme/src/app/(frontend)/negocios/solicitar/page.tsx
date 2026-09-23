import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { listarAreas, listarSubareas } from "@/lib/actions";
import SolicitudAltaForm from "@/components/SolicitudAltaForm";
import { Area, Subarea } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function SolicitarNegocioPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  if (session.user?.rol === Rol.ADMIN) {
    redirect("/admin");
  }

  const areas: Area[] = await listarAreas();
  const subareasByArea: Record<string, Subarea[]> = {};

  for (const area of areas) {
    const subs = await listarSubareas(area.id);
    subareasByArea[area.id] = subs;
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Solicitar alta de negocio
          </h1>
          <p className="text-muted-foreground mt-2">
            Completa los datos de tu negocio y envía la solicitud. Un administrador
            la revisará y la aprobará.
          </p>
        </div>
        <SolicitudAltaForm areas={areas} subareasByArea={subareasByArea} />
      </div>
    </main>
  );
}
