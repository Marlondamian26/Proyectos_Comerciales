import { LoadingRegion } from "@/components/skeletons/LoadingSkeletons";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ConfirmacionLoading() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <LoadingRegion label="Cargando confirmación" className="space-y-6">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-8 text-center">
          <Skeleton variant="circle" className="h-16 w-16" />
          <Skeleton variant="text" className="h-8 w-64 max-w-full" />
          <Skeleton variant="text" className="h-4 w-80 max-w-full" />
        </div>
        <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
          <Skeleton variant="text" className="h-6 w-40" />
          <Skeleton variant="rect" className="h-16 w-full rounded-lg" />
          <Skeleton variant="rect" className="h-11 w-40 rounded-lg" />
        </div>
      </LoadingRegion>
    </main>
  );
}
