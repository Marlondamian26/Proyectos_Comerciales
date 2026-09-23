import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { obtenerNegocioDelUsuario, listarPedidosNegocioAction } from "@/lib/actions";
import PedidosTable, { type Pedido } from "@/components/negocio/PedidosTable";
import { Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  if (!session || (session.user?.rol !== Rol.NEGOCIO && session.user?.rol !== Rol.ADMIN)) {
    redirect("/");
  }

  const negocio = userId ? await obtenerNegocioDelUsuario(userId) : null;

  if (!negocio || !negocio.id) {
    redirect("/negocio");
  }

  const pedidos = await listarPedidosNegocioAction(negocio.id);

  return (
    <main className="min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <Package className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pedidos</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        Gestiona los pedidos de tu negocio. Cambia el estado directamente desde la tabla.
      </p>
      <PedidosTable negocioId={negocio.id} pedidos={pedidos as unknown as Pedido[]} />
    </main>
  );
}
