import { LoadingRegion, ProductGridSkeleton } from "@/components/skeletons/LoadingSkeletons";
import { Skeleton } from "@/components/ui/Skeleton";

export default function CatalogoLoading() {
  return (
    <main className="container mx-auto space-y-8 px-4 py-10">
      <LoadingRegion label="Cargando catálogo" className="space-y-8">
        <div className="space-y-3">
          <Skeleton variant="text" className="mx-auto h-9 w-48" />
          <Skeleton variant="text" className="mx-auto h-5 w-72 max-w-full" />
        </div>
        <Skeleton variant="rect" className="h-12 w-full rounded-lg" />
        <ProductGridSkeleton count={8} />
      </LoadingRegion>
    </main>
  );
}
