import { DashboardPageSkeleton, LoadingRegion } from "@/components/skeletons/LoadingSkeletons";

export default function FrontendAdminLoading() {
  return (
    <LoadingRegion label="Cargando administración">
      <DashboardPageSkeleton />
    </LoadingRegion>
  );
}
