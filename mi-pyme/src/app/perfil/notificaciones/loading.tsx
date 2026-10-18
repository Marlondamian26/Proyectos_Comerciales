import { LoadingRegion, TablePageSkeleton } from "@/components/skeletons/LoadingSkeletons";

export default function PerfilNotificacionesLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <LoadingRegion label="Cargando preferencias de notificaciones">
        <TablePageSkeleton rows={4} columns={3} />
      </LoadingRegion>
    </main>
  );
}
