import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { obtenerNegocioDelUsuario, listarInventarioDeNegocioAction } from "@/lib/actions";
import InventarioTable from "@/components/negocio/InventarioTable";
import { PageBackButton } from "@/components/ui/PageBackButton";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  if (!session || (session.user?.rol !== Rol.NEGOCIO && session.user?.rol !== Rol.ADMIN)) {
    redirect("/");
  }

  const negocio = userId ? await obtenerNegocioDelUsuario(userId) : null;

  if (!negocio || !negocio.id) {
    redirect("/negocio");
  }

  const inventario = await listarInventarioDeNegocioAction(negocio.id);

  return (
    <>
      <PageBackButton rol="NEGOCIO" />
      <InventarioTable negocioId={negocio.id} inventario={inventario} />
    </>
  );
}
