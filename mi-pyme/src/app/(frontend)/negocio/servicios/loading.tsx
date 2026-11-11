import { LoadingRegion, ServiceGridSkeleton } from "@/components/skeletons/LoadingSkeletons";

export default function ServiciosNegocioLoading() {
  return (
    <LoadingRegion label="Cargando servicios del negocio" className="space-y-6">
      <ServiceGridSkeleton count={6} />
    </LoadingRegion>
  );
}
