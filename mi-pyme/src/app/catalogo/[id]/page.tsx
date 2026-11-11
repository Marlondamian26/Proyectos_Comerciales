import { notFound } from "next/navigation";
import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Home } from "lucide-react";
import Link from "next/link";
import { obtenerProductoConDisponibilidadAction } from "@/lib/actions";
import { getDisponibilidadSemanaAction } from "@/lib/actions";
import { catalogoAddToCart } from "../actions";
import { ProductoDetalleForm } from "@/components/productoDetalleForm";

interface CatalogoItem {
  id: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  unidadMedida: string;
  imagenUrl: string;
  negocio: { nombre: string };
  disponibleHoy: {
    cantidadDisponible: number;
    disponible: boolean;
    cantidadReservada: number;
  } | null;
}

export const dynamic = "force-dynamic";

export default async function ProductoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [producto, semana] = await Promise.all([
    obtenerProductoConDisponibilidadAction(id),
    getDisponibilidadSemanaAction(id),
  ]);

  if (!producto) {
    notFound();
  }

  const item = producto as unknown as CatalogoItem;

  return (
    <main className="container py-12">
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link href="/catalogo">
          <Button variant="ghost" size="sm" className="gap-2">
            <Home className="h-4 w-4" />
            Volver al catálogo
          </Button>
        </Link>
        <ThemeToggle />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <Image
            src={item.imagenUrl}
            alt={item.nombre}
            width={600}
            height={400}
            className="w-full rounded-xl object-cover"
          />
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{item.nombre}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {item.negocio.nombre} · {item.unidadMedida}
            </p>
            {item.descripcion && (
              <p className="text-muted-foreground mt-4">{item.descripcion}</p>
            )}
          </div>

          <ProductoDetalleForm
            productoId={item.id}
            nombre={item.nombre}
            precio={item.precio}
            disponibleHoy={item.disponibleHoy}
            semanaDisponibilidad={semana}
            onAgregarAlCarrito={catalogoAddToCart}
          />
        </div>
      </div>
    </main>
  );
}
