import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { obtenerNegocioDelUsuario } from "@/lib/actions";
import PromocionesPanel from "@/components/negocio/PromocionesPanel";
import { listarPromocionesAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function PromocionesPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  if (!session || (session.user?.rol !== Rol.NEGOCIO && session.user?.rol !== Rol.ADMIN)) {
    redirect("/");
  }

  const negocio = userId ? await obtenerNegocioDelUsuario(userId) : null;
  if (!negocio || !negocio.id) {
    redirect("/negocio");
  }

  const { promociones } = await listarPromocionesAction(negocio.id);

  return (
    <div className="p-6">
      <PromocionesPanel promociones={promociones ?? []} />
    </div>
  );
}
