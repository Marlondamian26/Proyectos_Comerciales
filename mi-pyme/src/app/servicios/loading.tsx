import { LoadingRegion, ServiceGridSkeleton } from "@/components/skeletons/LoadingSkeletons";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ServiciosLoading() {
  return (
    <main className="container mx-auto space-y-8 px-4 py-10">
      <LoadingRegion label="Cargando servicios" className="space-y-8">
        <div className="space-y-3 text-center">
          <Skeleton variant="text" className="mx-auto h-10 w-48" />
          <Skeleton variant="text" className="mx-auto h-5 w-96 max-w-full" />
        </div>
        <ServiceGridSkeleton count={6} />
      </LoadingRegion>
    </main>
  );
}
