import { LoadingRegion, ProductGridSkeleton } from "@/components/skeletons/LoadingSkeletons";

export default function ProductosNegocioLoading() {
  return (
    <LoadingRegion label="Cargando productos del negocio" className="space-y-6">
      <ProductGridSkeleton count={6} />
    </LoadingRegion>
  );
}
