import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { obtenerNegocioDelUsuario } from "@/lib/actions";
import HorarioEditor from "@/components/negocio/HorarioEditor";

export const dynamic = "force-dynamic";

export default async function HorariosPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  if (!session || (session.user?.rol !== Rol.NEGOCIO && session.user?.rol !== Rol.ADMIN)) {
    redirect("/");
  }

  const negocio = userId ? await obtenerNegocioDelUsuario(userId) : null;

  if (!negocio || !negocio.id) {
    redirect("/negocio");
  }

  const horariosNormalizados = (negocio.horarios ?? []).map((h) => ({
    diaSemana: h.diaSemana,
    horaApertura: h.horaApertura,
    horaCierre: h.horaCierre,
    cerrado: h.cerrado,
  }));

  return <HorarioEditor negocioId={negocio.id} horariosIniciales={horariosNormalizados} />;
}
