import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DisponibilidadBadge } from "@/components/ui/DisponibilidadBadge";
import { EmptyStatePreset } from "@/components/ui/EmptyState";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  listarProductosConDisponibilidad,
  listarServiciosConCupos,
  listarAreas,
  listarSubareas,
} from "@/lib/actions";
import { auth } from "@/lib/auth";
import { catalogoAddToCart, catalogoReserve } from "./actions";
import Link from "next/link";
import { Home } from "lucide-react";
import type {
  ProductoConDisponibilidad,
  ServicioConCupos,
  ListarProductosParams,
  ListarServiciosParams,
} from "@/services/CatalogService";

export const dynamic = "force-dynamic";

interface CatalogoFiltros {
  areaId?: string;
  subareaId?: string;
  disponibleHoy?: string;
  q?: string;
  page?: string;
  tipo?: string;
}

const ITEMS_PER_PAGE = 12;

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<CatalogoFiltros>;
}) {
  const session = await auth();
  const filtros = await searchParams;

  const page = parseInt(filtros.page || "1", 10);
  const offset = (page - 1) * ITEMS_PER_PAGE;

  const [productos, servicios, areas, subareas] = await Promise.all([
    listarProductosConDisponibilidad(
      filtros as unknown as ListarProductosParams
    ),
    listarServiciosConCupos(filtros as unknown as ListarServiciosParams),
    listarAreas(),
    listarSubareas(filtros.areaId),
  ]);

  const query = filtros.q?.toLowerCase() || "";

  const productosFiltrados = productos.filter((p) => {
    const matchesQuery =
      p.nombre.toLowerCase().includes(query) ||
      p.descripcion?.toLowerCase().includes(query) ||
      p.negocio.nombre.toLowerCase().includes(query);
    if (!matchesQuery) return false;

    if (filtros.disponibleHoy === "true") {
      return p.disponibleHoy?.disponible === true;
    }
    if (filtros.disponibleHoy === "false") {
      return p.disponibleHoy?.disponible !== true;
    }
    return true;
  });

  const serviciosFiltrados = servicios.filter((s) => {
    const matchesQuery =
      s.nombre.toLowerCase().includes(query) ||
      s.descripcion?.toLowerCase().includes(query) ||
      s.negocio.nombre.toLowerCase().includes(query);
    if (!matchesQuery) return false;

    if (filtros.disponibleHoy === "true") {
      return s.cuposDisponiblesHoy?.disponible === true;
    }
    if (filtros.disponibleHoy === "false") {
      return s.cuposDisponiblesHoy?.disponible !== true;
    }
    return true;
  });

  const totalProductos = productosFiltrados.length;
  const totalServicios = serviciosFiltrados.length;
  const totalItems = totalProductos + totalServicios;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  let combined: Array<
    (ProductoConDisponibilidad & { _tipo: "producto" }) |
    (ServicioConCupos & { _tipo: "servicio" })
  > = [];

  if (page === 1) {
    const prodSlice = productosFiltrados.slice(0, ITEMS_PER_PAGE);
    const neededFromSvc = ITEMS_PER_PAGE - prodSlice.length;
    const svcSlice = serviciosFiltrados.slice(0, Math.max(0, neededFromSvc));
    combined = [
      ...prodSlice.map((p) => ({ ...p, _tipo: "producto" as const })),
      ...svcSlice.map((s) => ({ ...s, _tipo: "servicio" as const })),
    ];
  } else {
    const itemsBefore = (page - 1) * ITEMS_PER_PAGE;
    const allItems = [
      ...productosFiltrados.map((p) => ({ ...p, _tipo: "producto" as const })),
      ...serviciosFiltrados.map((s) => ({ ...s, _tipo: "servicio" as const })),
    ];
    combined = allItems.slice(itemsBefore, itemsBefore + ITEMS_PER_PAGE);
  }

  const activeFilters = Object.entries(filtros).filter(
    ([, v]) => v !== undefined && v !== ""
  ).length;

  return (
    <main className="container py-12">
      <header className="mb-12">
        <div className="mb-4 flex items-center justify-between gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 whitespace-nowrap">
              <Home className="h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
          <ThemeToggle />
        </div>
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

          <form method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="flex flex-col gap-2 lg:col-span-2">
              <label htmlFor="q" className="text-sm font-medium">
                Buscar
              </label>
              <input
                type="search"
                id="q"
                name="q"
                defaultValue={query}
                placeholder="Buscar productos, servicios, negocios..."
                className="rounded-md border px-3 py-2 text-sm"
                aria-label="Buscar en catálogo"
              />
            </div>

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
              <label htmlFor="disponibleHoy" className="text-sm font-medium">
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
              <Link
                href="/catalogo"
                className="text-primary hover:underline"
              >
                Limpiar
              </Link>
            </div>
          )}
        </section>
      </header>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold" aria-label="Productos">
            Productos ({totalProductos})
          </h2>
        </div>
        {combined.filter((item) => item._tipo === "producto").length === 0 &&
        query ? (
          <EmptyStatePreset
            preset="search"
            action={{
              label: "Limpiar búsqueda",
              href: "/catalogo",
            }}
          />
        ) : combined.filter((item) => item._tipo === "producto").length ===
          0 &&
          !query ? (
          <EmptyStatePreset
            preset="products"
            action={{
              label: "Agregar primer producto",
              href: "/admin/productos/nuevo",
            }}
          />
        ) : (
          <>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Productos">
              {combined
                .filter((item) => item._tipo === "producto")
                .map((producto) => {
                  const disp = producto.disponibleHoy;
                  const disponible = disp?.disponible ?? false;
                  const cantidad = disp?.cantidadDisponible ?? 0;
                  return (
                    <li key={producto.id}>
                      <Card
                        title={producto.nombre}
                        description={producto.descripcion ?? undefined}
                        image={{
                          src: producto.imagenUrl,
                          alt: producto.nombre,
                        }}
                        badge={{
                          text: disponible ? "Disponible" : "Agotado",
                          variant: disponible ? "success" : "error",
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
                      >
                        <div className="flex flex-col gap-3 mt-4">
                          <DisponibilidadBadge
                            disponible={disponible}
                            cantidad={cantidad}
                            variante="producto"
                          />
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1"
                            formAction={catalogoAddToCart}
                            disabled={!disponible}
                            title={
                              !disponible
                                ? "No disponible hoy"
                                : undefined
                            }
                            aria-label={
                              disponible
                                ? `Agregar ${producto.nombre} al carrito`
                                : `${producto.nombre} no disponible hoy`
                            }
                          >
                            <input
                              type="hidden"
                              name="productoId"
                              value={producto.id}
                            />
                            Agregar al carrito
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            asChild
                          >
                            <Link
                              href={`/catalogo/${producto.id}`}
                              aria-label={`Ver detalle de ${producto.nombre}`}
                              data-testid="ver-detalle-producto"
                            >
                              Ver detalle
                            </Link>
                          </Button>
                        </div>
                      </Card>
                    </li>
                  );
                })}
            </ul>

            {totalPages > 1 && (
              <nav
                className="mt-8 flex items-center justify-center gap-2"
                aria-label="Paginación de productos"
              >
                {page > 1 && (
                  <a
                    href={`/catalogo?${new URLSearchParams({
                      ...filtros,
                      page: String(page - 1),
                    })}`}
                    className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
                    aria-label="Página anterior"
                  >
                    Anterior
                  </a>
                )}
                <span className="px-3 py-2 text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                {page < totalPages && (
                  <a
                    href={`/catalogo?${new URLSearchParams({
                      ...filtros,
                      page: String(page + 1),
                    })}`}
                    className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
                    aria-label="Página siguiente"
                  >
                    Siguiente
                  </a>
                )}
              </nav>
            )}
          </>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold" aria-label="Servicios">
            Servicios ({totalServicios})
          </h2>
        </div>
        {combined.filter((item) => item._tipo === "servicio").length === 0 &&
        query ? (
          <EmptyStatePreset
            preset="search"
            action={{
              label: "Limpiar búsqueda",
              href: "/catalogo",
            }}
          />
        ) : combined.filter((item) => item._tipo === "servicio").length ===
          0 &&
          !query ? (
          <EmptyStatePreset
            preset="services"
            action={{
              label: "Agregar primer servicio",
              href: "/admin/servicios/nuevo",
            }}
          />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Servicios">
            {combined
              .filter((item) => item._tipo === "servicio")
              .map((servicio) => {
                const cupos = servicio.cuposDisponiblesHoy;
                const disponible = cupos?.disponible ?? servicio.activo;
                const cantidadCupos = cupos?.cuposDisponibles ?? 0;
                return (
                  <li key={servicio.id}>
                    <Card
                      title={servicio.nombre}
                      description={servicio.descripcion ?? undefined}
                      image={{
                        src: servicio.imagenUrl || "/placeholder-service.jpg",
                        alt: servicio.nombre,
                      }}
                      badge={{
                        text: disponible ? "Disponible" : "Sin cupos",
                        variant: disponible ? "success" : "error",
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
                    >
                      <div className="flex flex-col gap-3 mt-4">
                        <DisponibilidadBadge
                          disponible={disponible}
                          cantidad={cantidadCupos}
                          variante="servicio"
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          formAction={catalogoReserve}
                          disabled={!disponible}
                          title={
                            !disponible
                              ? "Sin cupos disponibles hoy"
                              : undefined
                          }
                          aria-label={
                            disponible
                              ? `Reservar ${servicio.nombre}`
                              : `${servicio.nombre} sin cupos hoy`
                          }
                        >
                          <input
                            type="hidden"
                            name="servicioId"
                            value={servicio.id}
                          />
                          Reservar
                        </Button>
                      </div>
                    </Card>
                  </li>
                );
              })}
          </ul>
        )}
      </section>
    </main>
  );
}
