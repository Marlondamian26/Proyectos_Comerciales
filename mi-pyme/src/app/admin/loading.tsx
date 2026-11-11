import { DashboardPageSkeleton, LoadingRegion } from "@/components/skeletons/LoadingSkeletons";

export default function AdminLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <LoadingRegion label="Cargando panel de administración">
        <DashboardPageSkeleton />
      </LoadingRegion>
    </main>
  );
}
