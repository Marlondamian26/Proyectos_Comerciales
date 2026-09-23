import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { obtenerNegocioDelUsuario, listOpcionesDeNegocioAction } from "@/lib/actions";
import OpcionLogisticaForm from "@/components/negocio/OpcionLogisticaForm";

export const dynamic = "force-dynamic";

export default async function LogisticaPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  if (!session || (session.user?.rol !== Rol.NEGOCIO && session.user?.rol !== Rol.ADMIN)) {
    redirect("/");
  }

  const negocio = userId ? await obtenerNegocioDelUsuario(userId) : null;

  if (!negocio || !negocio.id) {
    redirect("/negocio");
  }

  const opciones = await listOpcionesDeNegocioAction(negocio.id);

  return (
    <OpcionLogisticaForm
      negocioId={negocio.id}
      opciones={opciones as unknown as Parameters<typeof OpcionLogisticaForm>[0]["opciones"]}
    />
  );
}
