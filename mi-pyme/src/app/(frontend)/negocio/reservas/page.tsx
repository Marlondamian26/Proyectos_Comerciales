import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { obtenerNegocioDelUsuario, listarReservasNegocioAction } from "@/lib/actions";
import ReservasTable from "@/components/negocio/ReservasTable";
import { CalendarCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReservasPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  if (!session || (session.user?.rol !== Rol.NEGOCIO && session.user?.rol !== Rol.ADMIN)) {
    redirect("/");
  }

  const negocio = userId ? await obtenerNegocioDelUsuario(userId) : null;

  if (!negocio || !negocio.id) {
    redirect("/negocio");
  }

  const reservas = await listarReservasNegocioAction(negocio.id);

  return (
    <main className="min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <CalendarCheck className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reservas</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        Gestiona las reservas de servicios de tu negocio. Confirma o cancela desde la tabla.
      </p>
      <ReservasTable negocioId={negocio.id} reservas={reservas} />
    </main>
  );
}
