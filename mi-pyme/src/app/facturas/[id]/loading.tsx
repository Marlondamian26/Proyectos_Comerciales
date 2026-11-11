import { DetailPageSkeleton, LoadingRegion } from "@/components/skeletons/LoadingSkeletons";

export default function FacturaDetalleLoading() {
  return (
    <main className="container mx-auto px-4 py-10">
      <LoadingRegion label="Cargando detalle de la factura">
        <DetailPageSkeleton />
      </LoadingRegion>
    </main>
  );
}
