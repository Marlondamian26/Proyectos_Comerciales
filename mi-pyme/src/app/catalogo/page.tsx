import Link from "next/link";
import Image from "next/image";
import { listarProductos } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  const productos = await listarProductos();

  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">Catálogo de Productos</h1>

      {productos.length === 0 ? (
        <p className="text-sm text-gray-500">
          No hay productos disponibles en este momento.
        </p>
      ) : (
        <ul className="space-y-4">
          {productos.map((producto) => (
            <li
              key={producto.id}
              className="border rounded p-4 flex gap-4 items-center"
            >
              {producto.imagenUrl && (
                <Image
                  src={producto.imagenUrl}
                  alt={producto.nombre}
                  width={64}
                  height={64}
                  className="object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h2 className="font-bold text-lg">{producto.nombre}</h2>
                {producto.descripcion && (
                  <p className="text-sm text-gray-600 mt-1">
                    {producto.descripcion}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Precio: ${producto.precio.toFixed(2)} · {producto.unidadMedida}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Negocio: {producto.negocio.nombre}
                </p>
              </div>
              <Link
                href={`/carrito?agregar=prod_${producto.id}`}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Añadir al carrito
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <Link
          href="/carrito"
          className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Ver carrito →
        </Link>
      </div>
    </main>
  );
}
