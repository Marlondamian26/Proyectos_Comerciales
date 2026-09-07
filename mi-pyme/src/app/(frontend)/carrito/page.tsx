import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";
import { listarCarrito, eliminarCarritoItem, vaciarCarrito } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function CarritoPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <main className="max-w-4xl mx-auto py-12 px-6">
        <h1 className="text-3xl font-bold mb-8">Carrito</h1>
        <p className="text-sm text-gray-500">
          Debes iniciar sesión para ver tu carrito.
        </p>
      </main>
    );
  }

  const carrito = await listarCarrito(session.user.id);

  const items = carrito?.items ?? [];
  const total = items.reduce((sum, item) => {
    const precio = item.producto?.precio ?? 0;
    return sum + precio * item.cantidad;
  }, 0);

  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">Carrito</h1>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">El carrito está vacío.</p>
      ) : (
        <>
          <ul className="space-y-4 mb-6">
            {items.map((item) => {
              const producto = item.producto;
              const servicio = item.servicio;
              const nombre = producto?.nombre ?? servicio?.nombre ?? "Item";
              const precio = item.precioUnitario;

              return (
                <li
                  key={item.id}
                  className="border rounded p-4 flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-bold text-lg">{nombre}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Cantidad: {item.cantidad}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      Precio unitario: ${precio.toFixed(2)}
                    </p>
                    <p className="text-sm font-medium text-gray-800 mt-1">
                      Subtotal: ${(precio * item.cantidad).toFixed(2)}
                    </p>
                  </div>
                  <form action={async () => {
                    "use server";
                    await eliminarCarritoItem(item.id, session.user.id);
                  }}>
                    <button
                      type="submit"
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Eliminar ítem
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>

          <div className="border-t pt-4 mb-6">
            <p className="text-lg font-bold">
              Total: ${total.toFixed(2)}
            </p>
          </div>

          <form action={async () => {
            "use server";
            await vaciarCarrito(session.user.id);
          }}>
            <button
              type="submit"
              className="text-sm text-red-600 hover:text-red-800 font-medium border border-red-200 px-4 py-2 rounded"
            >
              Vaciar carrito
            </button>
          </form>
        </>
      )}
    </main>
  );
}
