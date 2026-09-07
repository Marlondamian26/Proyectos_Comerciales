import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { listarProductos, listarServicios, listarAreas, listarSubareas } from "@/lib/actions";

export const dynamic = "force-dynamic";

interface CatalogoFiltros {
  areaId?: string;
  subareaId?: string;
  disponibleHoy?: string;
}

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<CatalogoFiltros>;
}) {
  const filtros = await searchParams;

  const [productos, servicios, areas, subareas] = await Promise.all([
    listarProductos({
      areaId: filtros.areaId,
      subareaId: filtros.subareaId,
      disponibleHoy: filtros.disponibleHoy === "true",
    }),
    listarServicios({
      areaId: filtros.areaId,
      subareaId: filtros.subareaId,
    }),
    listarAreas(),
    listarSubareas(filtros.areaId),
  ]);

  const activeFilters = Object.entries(filtros).filter(
    ([, v]) => v !== undefined && v !== ""
  ).length;

  return (
    <main className="container py-12">
      <h1 className="text-3xl font-bold mb-2" id="catalogo-title">
        Catálogo de Mi-Pyme
      </h1>
      <p className="text-muted-foreground mb-8">
        Descubre productos y servicios de negocios de confianza.
      </p>

      <section
        className="mb-8 rounded-lg border bg-card p-6"
        aria-labelledby="filtros-title"
      >
        <h2 id="filtros-title" className="text-lg font-semibold mb-4">
          Filtros
        </h2>

        <form method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="areaId" className="text-sm font-medium">
              Área
            </label>
            <select
              id="areaId"
              name="areaId"
              defaultValue={filtros.areaId ?? ""}
              className="rounded-md border px-3 py-2 text-sm"
              aria-label="Filtrar por área"
            >
              <option value="">Todas las áreas</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nombre}
                </option>
              ))}
            </select>
          </div>

          {filtros.areaId && (
            <div className="flex flex-col gap-2">
              <label htmlFor="subareaId" className="text-sm font-medium">
                Subárea
              </label>
              <select
                id="subareaId"
                name="subareaId"
                defaultValue={filtros.subareaId ?? ""}
                className="rounded-md border px-3 py-2 text-sm"
                aria-label="Filtrar por subárea"
              >
                <option value="">Todas las subáreas</option>
                {subareas.map((subarea) => (
                  <option key={subarea.id} value={subarea.id}>
                    {subarea.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label
              htmlFor="disponibleHoy"
              className="text-sm font-medium"
            >
              Disponible hoy
            </label>
            <select
              id="disponibleHoy"
              name="disponibleHoy"
              defaultValue={filtros.disponibleHoy ?? ""}
              className="rounded-md border px-3 py-2 text-sm"
              aria-label="Filtrar por disponibilidad"
            >
              <option value="">Cualquiera</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              aria-label="Aplicar filtros"
            >
              Aplicar
            </Button>
          </div>
        </form>

        {activeFilters > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{activeFilters} filtro(s) activo(s)</span>
          </div>
        )}
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6" aria-label="Productos">
          Productos
        </h2>
        {productos.length === 0 ? (
          <div
            className="rounded-lg border border-dashed p-8 text-center"
            aria-live="polite"
          >
            <p className="text-muted-foreground">
              No hay productos disponibles en este momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {productos.map((producto) => (
              <Card
                key={producto.id}
                title={producto.nombre}
                description={producto.descripcion ?? undefined}
                image={{
                  src: producto.imagenUrl,
                  alt: producto.nombre,
                }}
                badge={{
                  text: producto.disponibleHoy ? "Disponible" : "Agotado",
                  variant: producto.disponibleHoy
                    ? "success"
                    : "warning",
                }}
                footer={
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">
                      ${producto.precio.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {producto.negocio.nombre} · {producto.unidadMedida}
                    </span>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6" aria-label="Servicios">
          Servicios
        </h2>
        {servicios.length === 0 ? (
          <div
            className="rounded-lg border border-dashed p-8 text-center"
            aria-live="polite"
          >
            <p className="text-muted-foreground">
              No hay servicios disponibles en este momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {servicios.map((servicio) => (
              <Card
                key={servicio.id}
                title={servicio.nombre}
                description={servicio.descripcion ?? undefined}
                image={{
                  src: servicio.imagenUrl,
                  alt: servicio.nombre,
                }}
                badge={{
                  text: servicio.activo ? "Activo" : "Inactivo",
                  variant: servicio.activo ? "success" : "warning",
                }}
                footer={
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {servicio.duracionMinutos} min · Capacidad:{" "}
                      {servicio.capacidad}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {servicio.negocio.nombre}
                    </span>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
