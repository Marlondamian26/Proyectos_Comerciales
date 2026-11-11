import { DashboardPageSkeleton, LoadingRegion } from "@/components/skeletons/LoadingSkeletons";

export default function NegocioLoading() {
  return (
    <LoadingRegion label="Cargando panel del negocio">
      <DashboardPageSkeleton />
    </LoadingRegion>
  );
}
