import { LoadingRegion } from "@/components/skeletons/LoadingSkeletons";
import { NotificationListSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function NotificacionesLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <LoadingRegion label="Cargando notificaciones">
        <div className="mb-6 space-y-3">
          <Skeleton variant="text" className="h-8 w-56" />
          <Skeleton variant="text" className="h-4 w-80 max-w-full" />
        </div>
        <NotificationListSkeleton count={5} />
      </LoadingRegion>
    </main>
  );
}
