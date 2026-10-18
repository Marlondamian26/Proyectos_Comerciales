import { DashboardPageSkeleton, LoadingRegion } from "@/components/skeletons/LoadingSkeletons";

export default function FrontendLoading() {
  return (
    <LoadingRegion label="Cargando panel" className="mx-auto w-full max-w-7xl">
      <DashboardPageSkeleton />
    </LoadingRegion>
  );
}
