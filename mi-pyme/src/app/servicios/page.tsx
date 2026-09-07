import Link from "next/link";
import Image from "next/image";
import { listarServicios } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ServiciosPage({
  searchParams,
}: {
  searchParams: Promise<{ negocioId?: string }>;
}) {
  const { negocioId } = await searchParams;
  const servicios = await listarServicios(
    negocioId ? { negocioId } : undefined
  );

  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">Servicios</h1>

      {servicios.length === 0 ? (
        <p className="text-sm text-gray-500">
          No hay servicios disponibles en este momento.
        </p>
      ) : (
        <ul className="space-y-4">
          {servicios.map((servicio) => (
            <li
              key={servicio.id}
              className="border rounded p-4 flex gap-4 items-center"
            >
              {servicio.imagenUrl && (
                <Image
                  src={servicio.imagenUrl}
                  alt={servicio.nombre}
                  width={64}
                  height={64}
                  className="object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h2 className="font-bold text-lg">{servicio.nombre}</h2>
                {servicio.descripcion && (
                  <p className="text-sm text-gray-600 mt-1">
                    {servicio.descripcion}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Duración: {servicio.duracionMinutos} min · Capacidad:{" "}
                  {servicio.capacidad}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Negocio: {servicio.negocio.nombre}
                </p>
              </div>
              <Link
                href={`/reservas?servicioId=${servicio.id}`}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Reservar
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
