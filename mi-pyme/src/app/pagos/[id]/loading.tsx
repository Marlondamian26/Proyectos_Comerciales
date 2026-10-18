import { DetailPageSkeleton, LoadingRegion } from "@/components/skeletons/LoadingSkeletons";

export default function PagoDetalleLoading() {
  return (
    <main className="container mx-auto px-4 py-10">
      <LoadingRegion label="Cargando detalle del pago">
        <DetailPageSkeleton />
      </LoadingRegion>
    </main>
  );
}
