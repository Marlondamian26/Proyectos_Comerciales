import { DetailPageSkeleton, LoadingRegion } from "@/components/skeletons/LoadingSkeletons";

export default function ProductoDetalleLoading() {
  return (
    <main className="container mx-auto px-4 py-10">
      <LoadingRegion label="Cargando detalle del producto">
        <DetailPageSkeleton />
      </LoadingRegion>
    </main>
  );
}
