import {
  listarAreas,
  listarSubareas,
  listarProductos,
  listarServicios,
} from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  const [areas, subareas, productos, servicios] = await Promise.all([
    listarAreas(),
    listarSubareas(),
    listarProductos(),
    listarServicios(),
  ]);

  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">Catálogo</h1>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Áreas</h2>
        {areas.length === 0 ? (
          <p className="text-sm text-gray-500">No hay áreas disponibles.</p>
        ) : (
          <ul className="space-y-2">
            {areas.map((area) => (
              <li key={area.id} className="border-b pb-1">
                <span className="font-medium">{area.nombre}</span>
                {area.slug && (
                  <span className="text-xs text-gray-500 ml-2">/{area.slug}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Subáreas</h2>
        {subareas.length === 0 ? (
          <p className="text-sm text-gray-500">No hay subáreas disponibles.</p>
        ) : (
          <ul className="space-y-2">
            {subareas.map((subarea) => (
              <li key={subarea.id} className="border-b pb-1">
                <span className="font-medium">{subarea.nombre}</span>
                {subarea.slug && (
                  <span className="text-xs text-gray-500 ml-2">/{subarea.slug}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Productos</h2>
        {productos.length === 0 ? (
          <p className="text-sm text-gray-500">No hay productos disponibles.</p>
        ) : (
          <ul className="space-y-4">
            {productos.map((producto) => (
              <li key={producto.id} className="border rounded p-4">
                <h3 className="font-bold text-lg">{producto.nombre}</h3>
                {producto.descripcion && (
                  <p className="text-sm text-gray-600 mt-1">
                    {producto.descripcion}
                  </p>
                )}
                <p className="text-sm text-gray-700 mt-2">
                  Precio: ${producto.precio} {producto.unidadMedida}
                </p>
                {producto.disponibleHoy && (
                  <span className="inline-block text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-2">
                    Disponible hoy
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Servicios</h2>
        {servicios.length === 0 ? (
          <p className="text-sm text-gray-500">No hay servicios disponibles.</p>
        ) : (
          <ul className="space-y-4">
            {servicios.map((servicio) => (
              <li key={servicio.id} className="border rounded p-4">
                <h3 className="font-bold text-lg">{servicio.nombre}</h3>
                {servicio.descripcion && (
                  <p className="text-sm text-gray-600 mt-1">
                    {servicio.descripcion}
                  </p>
                )}
                <p className="text-sm text-gray-700 mt-2">
                  Duración: {servicio.duracionMinutos} min | Capacidad: {servicio.capacidad}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
