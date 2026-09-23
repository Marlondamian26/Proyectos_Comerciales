import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { obtenerNegocioDelUsuario, listarProductos, listarAreasAction } from "@/lib/actions";
import ProductosPanel from "@/components/negocio/ProductoForm";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  if (!session || (session.user?.rol !== Rol.NEGOCIO && session.user?.rol !== Rol.ADMIN)) {
    redirect("/");
  }

  const negocio = userId ? await obtenerNegocioDelUsuario(userId) : null;

  if (!negocio || !negocio.id) {
    redirect("/negocio");
  }

  const [productos, areas, subareasDb] = await Promise.all([
    listarProductos({ negocioId: negocio.id }),
    listarAreasAction(),
    prisma_subareas(negocio.id),
  ]);

  return (
    <ProductosPanel
      negocioId={negocio.id}
      productos={productos}
      areas={areas}
      subareasIniciales={subareasDb}
    />
  );
}

async function prisma_subareas(negocioId: string) {
  const prisma = (await import("@/lib/db/prisma")).default;
  const negocioSubareas = await prisma.negocioSubarea.findMany({
    where: { negocioId },
    include: { subarea: true },
  });
  return negocioSubareas.map((ns) => ns.subarea);
}
