import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { obtenerNegocioDelUsuario } from "@/lib/actions";
import CombosPanel from "@/components/negocio/CombosPanel";
import { listarCombosAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function CombosPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  if (!session || (session.user?.rol !== Rol.NEGOCIO && session.user?.rol !== Rol.ADMIN)) {
    redirect("/");
  }

  const negocio = userId ? await obtenerNegocioDelUsuario(userId) : null;
  if (!negocio || !negocio.id) {
    redirect("/negocio");
  }

  const { combos } = await listarCombosAction({ negocioId: negocio.id });

  return (
    <div className="p-6">
      <CombosPanel combos={combos ?? []} />
    </div>
  );
}
