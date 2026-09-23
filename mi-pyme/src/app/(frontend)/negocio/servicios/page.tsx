import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { obtenerNegocioDelUsuario, listarServicios, listarAreasAction } from "@/lib/actions";
import ServiciosPanel from "@/components/negocio/ServicioForm";

export const dynamic = "force-dynamic";

export default async function ServiciosPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  if (!session || (session.user?.rol !== Rol.NEGOCIO && session.user?.rol !== Rol.ADMIN)) {
    redirect("/");
  }

  const negocio = userId ? await obtenerNegocioDelUsuario(userId) : null;

  if (!negocio || !negocio.id) {
    redirect("/negocio");
  }

  const [servicios, areas] = await Promise.all([
    listarServicios({ negocioId: negocio.id }),
    listarAreasAction(),
  ]);

  // Obtener subareas del negocio para preselect
  const prisma = (await import("@/lib/db/prisma")).default;
  const negocioSubareas = await prisma.negocioSubarea.findMany({
    where: { negocioId: negocio.id },
    include: { subarea: true },
  });
  const subareasDb = negocioSubareas.map((ns) => ns.subarea);

  return (
    <ServiciosPanel
      negocioId={negocio.id}
      servicios={servicios}
      areas={areas}
      subareasIniciales={subareasDb}
    />
  );
}
